from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks, Header
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import httpx
import aiofiles
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'applecare-activation-secret-key-2025')
JWT_ALGORITHM = "HS256"

# Upload directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)
INVOICE_DIR = ROOT_DIR / 'invoices'
INVOICE_DIR.mkdir(exist_ok=True)

app = FastAPI(title="AppleCare+ Activation System")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class AppleCarePlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    part_code: str
    description: Optional[str] = ""
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppleCarePlanCreate(BaseModel):
    name: str
    part_code: str
    description: Optional[str] = ""

class ActivationRequestCreate(BaseModel):
    dealer_name: str
    dealer_mobile: str
    customer_name: str
    customer_mobile: str
    customer_email: EmailStr
    model_id: str
    serial_number: str
    plan_id: str
    device_activation_date: str
    billing_location: Optional[str] = ""
    payment_type: str = "Insta"

class ActivationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dealer_name: str
    dealer_mobile: str
    customer_name: str
    customer_mobile: str
    customer_email: str
    model_id: str
    serial_number: str
    plan_id: str
    plan_name: Optional[str] = ""
    plan_part_code: Optional[str] = ""
    device_activation_date: str
    billing_location: str = ""
    payment_type: str = "Insta"
    invoice_path: Optional[str] = None
    status: str = "pending"
    osticket_id: Optional[str] = None
    email_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "main_settings"
    apple_email: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_email: str = ""
    smtp_password: str = ""
    osticket_url: str = ""
    osticket_api_key: str = ""
    partner_name: str = ""
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    apple_email: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_email: Optional[str] = None
    smtp_password: Optional[str] = None
    osticket_url: Optional[str] = None
    osticket_api_key: Optional[str] = None
    partner_name: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "name": data.name,
        "password": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_token(user_id, data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=data.email, name=data.name)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"])
    )

@api_router.post("/auth/change-password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    if not verify_password(data.current_password, user_doc["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    return {"message": "Password changed successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user["id"], email=user["email"], name=user["name"])

# ==================== PLANS ROUTES ====================

@api_router.get("/plans", response_model=List[AppleCarePlan])
async def get_plans(active_only: bool = True):
    query = {"active": True} if active_only else {}
    plans = await db.plans.find(query, {"_id": 0}).to_list(1000)
    for plan in plans:
        if isinstance(plan.get('created_at'), str):
            plan['created_at'] = datetime.fromisoformat(plan['created_at'])
    return plans

@api_router.post("/plans", response_model=AppleCarePlan)
async def create_plan(data: AppleCarePlanCreate, user: dict = Depends(get_current_user)):
    plan = AppleCarePlan(**data.model_dump())
    doc = plan.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.plans.insert_one(doc)
    return plan

@api_router.put("/plans/{plan_id}", response_model=AppleCarePlan)
async def update_plan(plan_id: str, data: AppleCarePlanCreate, user: dict = Depends(get_current_user)):
    update_data = data.model_dump()
    result = await db.plans.update_one({"id": plan_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if isinstance(plan.get('created_at'), str):
        plan['created_at'] = datetime.fromisoformat(plan['created_at'])
    return plan

@api_router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str, user: dict = Depends(get_current_user)):
    result = await db.plans.update_one({"id": plan_id}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan deactivated"}

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings", response_model=SettingsModel)
async def get_settings(user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if not settings:
        default_settings = SettingsModel()
        doc = default_settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.settings.insert_one(doc)
        return default_settings
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    return settings

@api_router.put("/settings", response_model=SettingsModel)
async def update_settings(data: SettingsUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one(
        {"id": "main_settings"},
        {"$set": update_data},
        upsert=True
    )
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    return settings

# ==================== PDF GENERATION ====================

async def generate_invoice_pdf(request_data: dict, filename: str) -> str:
    filepath = INVOICE_DIR / filename
    
    doc = SimpleDocTemplate(str(filepath), pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, spaceAfter=20)
    elements.append(Paragraph("AppleCare+ Activation Invoice", title_style))
    elements.append(Spacer(1, 0.25 * inch))
    
    info_data = [
        ["Customer Name:", request_data.get('customer_name', '')],
        ["Customer Email:", request_data.get('customer_email', '')],
        ["Customer Mobile:", request_data.get('customer_mobile', '')],
        ["Dealer Name:", request_data.get('dealer_name', '')],
        ["Dealer Mobile:", request_data.get('dealer_mobile', '')],
        ["Model ID:", request_data.get('model_id', '')],
        ["Serial Number:", request_data.get('serial_number', '')],
        ["Plan:", request_data.get('plan_name', '')],
        ["Plan Code:", request_data.get('plan_part_code', '')],
        ["Activation Date:", request_data.get('device_activation_date', '')],
        ["Invoice Date:", datetime.now().strftime("%Y-%m-%d")],
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    
    doc.build(elements)
    return str(filepath)

# ==================== EMAIL SERVICE ====================

async def send_activation_email(request_data: dict, invoice_path: Optional[str] = None):
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if not settings or not settings.get('smtp_email') or not settings.get('apple_email'):
        logger.warning("Email settings not configured")
        return False
    
    msg = MIMEMultipart()
    msg['From'] = settings['smtp_email']
    msg['To'] = settings['apple_email']
    msg['Subject'] = f"AppleCare+ Activation Request - {request_data.get('customer_name', 'Customer')}"
    
    # Build email body with tabular format
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
    <h2>AppleCare+ Activation Request</h2>
    <p>Please find the activation details below:</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr style="background-color: #f2f2f2;">
            <th>IMEI/Serial</th>
            <th>NAME</th>
            <th>EMAIL ID</th>
            <th>MOBILE NO</th>
            <th>Plan Part Code</th>
            <th>Device DOP</th>
            <th>Billing Location</th>
            <th>Payment Type</th>
            <th>Plan Name</th>
            <th>Partner Name</th>
        </tr>
        <tr>
            <td>{request_data.get('serial_number', '')}</td>
            <td>{request_data.get('customer_name', '')}</td>
            <td>{request_data.get('customer_email', '')}</td>
            <td>{request_data.get('customer_mobile', '')}</td>
            <td>{request_data.get('plan_part_code', '')}</td>
            <td>{request_data.get('device_activation_date', '')}</td>
            <td>{request_data.get('billing_location', '')}</td>
            <td>{request_data.get('payment_type', 'Insta')}</td>
            <td>{request_data.get('plan_name', '')}</td>
            <td>{settings.get('partner_name', '')}</td>
        </tr>
    </table>
    <br>
    <p>Dealer Details:</p>
    <ul>
        <li>Dealer Name: {request_data.get('dealer_name', '')}</li>
        <li>Dealer Mobile: {request_data.get('dealer_mobile', '')}</li>
    </ul>
    <p>Best regards,<br>{settings.get('partner_name', 'Partner')}</p>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html_body, 'html'))
    
    # Attach invoice if exists
    if invoice_path and os.path.exists(invoice_path):
        with open(invoice_path, 'rb') as f:
            part = MIMEBase('application', 'pdf')
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename=invoice.pdf')
            msg.attach(part)
    
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.get('smtp_host', 'smtp.gmail.com'),
            port=settings.get('smtp_port', 587),
            username=settings['smtp_email'],
            password=settings['smtp_password'],
            start_tls=True
        )
        logger.info(f"Email sent successfully to {settings['apple_email']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

# ==================== OSTICKET SERVICE ====================

async def create_osticket(request_data: dict):
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if not settings or not settings.get('osticket_url') or not settings.get('osticket_api_key'):
        logger.warning("osTicket settings not configured")
        return None
    
    ticket_data = {
        "name": request_data.get('customer_name', ''),
        "email": request_data.get('customer_email', ''),
        "phone": request_data.get('customer_mobile', ''),
        "subject": f"AppleCare+ Activation - {request_data.get('serial_number', '')}",
        "message": f"""
AppleCare+ Activation Request

Customer Details:
- Name: {request_data.get('customer_name', '')}
- Email: {request_data.get('customer_email', '')}
- Mobile: {request_data.get('customer_mobile', '')}

Device Details:
- Model ID: {request_data.get('model_id', '')}
- Serial Number: {request_data.get('serial_number', '')}
- Activation Date: {request_data.get('device_activation_date', '')}

Plan: {request_data.get('plan_name', '')} ({request_data.get('plan_part_code', '')})

Dealer: {request_data.get('dealer_name', '')} ({request_data.get('dealer_mobile', '')})
        """,
        "topicId": "1"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings['osticket_url']}/api/tickets.json",
                json=ticket_data,
                headers={
                    "X-API-Key": settings['osticket_api_key'],
                    "Content-Type": "application/json"
                }
            )
            if response.status_code == 201:
                ticket_id = response.text.strip('"')
                logger.info(f"osTicket created: {ticket_id}")
                return ticket_id
            else:
                logger.error(f"osTicket creation failed: {response.text}")
                return None
    except Exception as e:
        logger.error(f"osTicket error: {e}")
        return None

# ==================== ACTIVATION REQUESTS ROUTES ====================

@api_router.get("/activation-requests", response_model=List[ActivationRequest])
async def get_activation_requests(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    requests = await db.activation_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for req in requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
        if isinstance(req.get('updated_at'), str):
            req['updated_at'] = datetime.fromisoformat(req['updated_at'])
    return requests

@api_router.get("/activation-requests/{request_id}", response_model=ActivationRequest)
async def get_activation_request(request_id: str, user: dict = Depends(get_current_user)):
    req = await db.activation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if isinstance(req.get('created_at'), str):
        req['created_at'] = datetime.fromisoformat(req['created_at'])
    if isinstance(req.get('updated_at'), str):
        req['updated_at'] = datetime.fromisoformat(req['updated_at'])
    return req

@api_router.post("/activation-requests", response_model=ActivationRequest)
async def create_activation_request(
    data: ActivationRequestCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    # Get plan details
    plan = await db.plans.find_one({"id": data.plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    request_obj = ActivationRequest(
        **data.model_dump(),
        plan_name=plan.get('name', ''),
        plan_part_code=plan.get('part_code', '')
    )
    
    doc = request_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    # Generate invoice PDF
    invoice_filename = f"invoice_{request_obj.id}.pdf"
    invoice_path = await generate_invoice_pdf(doc, invoice_filename)
    doc['invoice_path'] = invoice_path
    
    await db.activation_requests.insert_one(doc)
    
    # Background tasks: create osTicket and send email
    background_tasks.add_task(process_activation_request, request_obj.id)
    
    return request_obj

async def process_activation_request(request_id: str):
    """Background task to create osTicket and send email"""
    req = await db.activation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        return
    
    # Create osTicket
    osticket_id = await create_osticket(req)
    if osticket_id:
        await db.activation_requests.update_one(
            {"id": request_id},
            {"$set": {"osticket_id": osticket_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Send email to Apple
    email_sent = await send_activation_email(req, req.get('invoice_path'))
    await db.activation_requests.update_one(
        {"id": request_id},
        {"$set": {"email_sent": email_sent, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

@api_router.put("/activation-requests/{request_id}/status")
async def update_request_status(request_id: str, status: str, user: dict = Depends(get_current_user)):
    valid_statuses = ["pending", "email_sent", "payment_pending", "activated", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.activation_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Status updated"}

@api_router.post("/activation-requests/{request_id}/resend-email")
async def resend_email(request_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    req = await db.activation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    background_tasks.add_task(send_activation_email, req, req.get('invoice_path'))
    return {"message": "Email resend queued"}

@api_router.get("/activation-requests/{request_id}/invoice")
async def download_invoice(request_id: str, authorization: str = None):
    await get_current_user(authorization)
    req = await db.activation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req or not req.get('invoice_path'):
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if not os.path.exists(req['invoice_path']):
        raise HTTPException(status_code=404, detail="Invoice file not found")
    
    return FileResponse(
        req['invoice_path'],
        media_type='application/pdf',
        filename=f"invoice_{request_id}.pdf"
    )

# ==================== FILE UPLOAD ====================

@api_router.post("/upload-invoice/{request_id}")
async def upload_invoice(request_id: str, file: UploadFile = File(...), authorization: str = None):
    await get_current_user(authorization)
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    filename = f"uploaded_invoice_{request_id}.pdf"
    filepath = UPLOAD_DIR / filename
    
    async with aiofiles.open(filepath, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    await db.activation_requests.update_one(
        {"id": request_id},
        {"$set": {"invoice_path": str(filepath), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Invoice uploaded", "path": str(filepath)}

# ==================== DASHBOARD STATS ====================

@api_router.get("/stats")
async def get_stats(authorization: str = None):
    await get_current_user(authorization)
    
    total = await db.activation_requests.count_documents({})
    pending = await db.activation_requests.count_documents({"status": "pending"})
    activated = await db.activation_requests.count_documents({"status": "activated"})
    payment_pending = await db.activation_requests.count_documents({"status": "payment_pending"})
    
    return {
        "total": total,
        "pending": pending,
        "activated": activated,
        "payment_pending": payment_pending
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health():
    return {"status": "healthy", "service": "applecare-activation"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create default admin if not exists
    admin = await db.users.find_one({"email": "admin@applecare.com"})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@applecare.com",
            "name": "Admin",
            "password": hash_password("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Default admin created: admin@applecare.com / admin123")
    
    # Create some default plans if none exist
    plans_count = await db.plans.count_documents({})
    if plans_count == 0:
        default_plans = [
            {"id": str(uuid.uuid4()), "name": "AppleCare+", "part_code": "SR182HN/A", "description": "Standard AppleCare+ Protection", "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "AppleCare+ with Theft and Loss", "part_code": "SR183HN/A", "description": "AppleCare+ with Theft and Loss coverage", "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "AppleCare+ for Mac", "part_code": "SR184HN/A", "description": "AppleCare+ for Mac computers", "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "AppleCare+ for iPad", "part_code": "SR185HN/A", "description": "AppleCare+ for iPad devices", "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "AppleCare+ for Apple Watch", "part_code": "SR186HN/A", "description": "AppleCare+ for Apple Watch", "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.plans.insert_many(default_plans)
        logger.info("Default AppleCare+ plans created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
