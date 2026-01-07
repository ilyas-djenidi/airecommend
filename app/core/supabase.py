
import os
import logging
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

url: Optional[str] = os.environ.get("SUPABASE_URL")
key: Optional[str] = os.environ.get("SUPABASE_KEY")

supabase: Optional[Client] = None

if url and key:
    try:
        supabase = create_client(url, key)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {e}")
        supabase = None
else:
    logger.warning("SUPABASE_URL or SUPABASE_KEY not set - Supabase features disabled")

def get_supabase_client() -> Optional[Client]:
    """
    Returns the Supabase client if available.
    Returns None if Supabase is not configured.
    """
    return supabase
