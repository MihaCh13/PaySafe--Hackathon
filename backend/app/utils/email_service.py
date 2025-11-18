import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import os


def send_email(to_email, subject, html_content):
    """
    Send email using SMTP configuration from environment variables
    """
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER')
    smtp_password = os.getenv('SMTP_PASSWORD')
    from_email = os.getenv('SMTP_FROM_EMAIL', smtp_user)
    from_name = os.getenv('SMTP_FROM_NAME', 'UniPay')
    
    if not smtp_user or not smtp_password:
        current_app.logger.error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.")
        raise ValueError("Email service not configured")
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        current_app.logger.info(f"Password reset email sent successfully to {to_email}")
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise


def get_password_reset_email_html(reset_link, username):
    """
    Generate HTML email template for password reset with UniPay branding
    Uses lavender-to-cyan color palette (#9b87f5 -> #7DD3FC -> #60C5E8)
    """
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - UniPay</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f5f5f5;
                color: #333333;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #9b87f5 0%, #7DD3FC 50%, #60C5E8 100%);
                padding: 40px 30px;
                text-align: center;
            }}
            .logo-text {{
                font-size: 32px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -0.5px;
                margin-bottom: 16px;
                display: block;
            }}
            .header-title {{
                font-size: 24px;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .greeting {{
                font-size: 18px;
                color: #333333;
                margin-bottom: 20px;
                font-weight: 600;
            }}
            .message {{
                font-size: 16px;
                line-height: 1.6;
                color: #555555;
                margin-bottom: 30px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .reset-button {{
                display: inline-block;
                padding: 16px 40px;
                background: linear-gradient(135deg, #9b87f5 0%, #7DD3FC 50%, #60C5E8 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
            }}
            .info-box {{
                background: #f9f9f9;
                border-left: 4px solid #9b87f5;
                padding: 16px 20px;
                margin: 24px 0;
                border-radius: 8px;
            }}
            .info-box p {{
                margin: 0;
                font-size: 14px;
                color: #555555;
                line-height: 1.5;
            }}
            .expiry-notice {{
                font-size: 14px;
                color: #555555;
                margin-top: 20px;
                padding: 12px;
                background: #f0f9ff;
                border-radius: 8px;
                border-left: 4px solid #7DD3FC;
            }}
            .footer {{
                background: #fafafa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #eeeeee;
            }}
            .footer p {{
                margin: 5px 0;
                font-size: 13px;
                color: #777777;
            }}
            .footer a {{
                color: #9b87f5;
                text-decoration: none;
            }}
            .security-notice {{
                font-size: 13px;
                color: #555555;
                margin-top: 20px;
                line-height: 1.5;
            }}
            @media only screen and (max-width: 600px) {{
                .container {{
                    margin: 20px;
                }}
                .header {{
                    padding: 30px 20px;
                }}
                .content {{
                    padding: 30px 20px;
                }}
                .logo-text {{
                    font-size: 28px;
                }}
                .header-title {{
                    font-size: 20px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <span class="logo-text">UniPay</span>
                <h1 class="header-title">Password Reset Request</h1>
            </div>
            
            <div class="content">
                <p class="greeting">Hello {username},</p>
                
                <p class="message">
                    We received a request to reset the password for your UniPay student wallet account. 
                    If you made this request, click the button below to choose a new password.
                </p>
                
                <div class="button-container">
                    <a href="{reset_link}" class="reset-button">Reset Your Password</a>
                </div>
                
                <div class="info-box">
                    <p><strong>Alternative link:</strong></p>
                    <p style="word-break: break-all; margin-top: 8px;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="{reset_link}" style="color: #9b87f5;">{reset_link}</a>
                    </p>
                </div>
                
                <div class="expiry-notice">
                    <strong>⏰ This link will expire in 1 hour</strong> for your security.
                </div>
                
                <div class="security-notice">
                    <strong>Didn't request a password reset?</strong><br>
                    If you didn't make this request, you can safely ignore this email. Your password will remain unchanged.
                    For security reasons, we recommend changing your password if you suspect unauthorized access to your account.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>UniPay</strong> - Your Smart Student Wallet</p>
                <p>This is an automated message, please do not reply to this email.</p>
                <p style="margin-top: 15px;">
                    Need help? Contact us at <a href="mailto:support@unipay.com">support@unipay.com</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return html
