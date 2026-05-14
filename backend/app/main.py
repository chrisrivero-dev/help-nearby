from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import json
import boto3
from typing import List

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# S3 Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "helpnearby.co")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
MAILING_LIST_FILE_PATH = os.getenv("MAILING_LIST_FILE_PATH", "mailing-list/preview-signup.json")

# Initialize S3 client
s3_client = boto3.client("s3", region_name=S3_REGION)

class EmailInput(BaseModel):
    email: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/get-mailing-list-count")
def get_mailing_list_count():
    """Get the count of emails in the mailing list."""
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=MAILING_LIST_FILE_PATH)
        data = json.loads(response["Body"].read().decode("utf-8"))
        email_count = len(data.get("emails", []))
        return {"count": email_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading mailing list: {str(e)}")

@app.post("/api/join-mailing-list")
def join_mailing_list(email_input: EmailInput):
    """Add an email to the mailing list."""
    email = email_input.email.strip()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Simple email validation
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    try:
        # Read existing data
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=MAILING_LIST_FILE_PATH)
        data = json.loads(response["Body"].read().decode("utf-8"))
        
        emails = data.get("emails", [])
        
        # Check if email already exists
        if email in emails:
            raise HTTPException(status_code=409, detail="Email already subscribed")
        
        # Add email
        emails.append(email)
        data["emails"] = emails
        
        # Write updated data back to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=MAILING_LIST_FILE_PATH,
            Body=json.dumps(data, indent=2).encode("utf-8"),
            ContentType="application/json"
        )
        
        return {"message": "Successfully subscribed to mailing list"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating mailing list: {str(e)}")
