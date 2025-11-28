"""
安全和认证相关工具
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
from jose import JWTError, jwt

# JWT配置
SECRET_KEY = "your-secret-key-change-this-in-production-09af8s7df0a8sf"  # 请在生产环境中修改
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30天

# PBKDF2配置（使用Python内置方法，无需额外依赖）
PBKDF2_ITERATIONS = 260000  # OWASP推荐
SALT_LENGTH = 16  # 16字节salt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码
    hashed_password格式：salt$hash
    """
    try:
        salt_hex, hash_hex = hashed_password.split('$')
        salt = bytes.fromhex(salt_hex)
        stored_hash = bytes.fromhex(hash_hex)
        
        # 使用相同的salt计算密码哈希
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt,
            PBKDF2_ITERATIONS
        )
        
        # 使用恒定时间比较防止时序攻击
        return secrets.compare_digest(password_hash, stored_hash)
    except (ValueError, AttributeError):
        return False


def get_password_hash(password: str) -> str:
    """
    生成密码哈希
    使用PBKDF2-SHA256（Python内置，安全可靠）
    """
    # 生成随机salt
    salt = secrets.token_bytes(SALT_LENGTH)
    
    # 使用PBKDF2计算密码哈希
    password_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        PBKDF2_ITERATIONS
    )
    
    # 返回格式：salt$hash（都是十六进制）
    return f"{salt.hex()}${password_hash.hex()}"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """解码JWT令牌"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
