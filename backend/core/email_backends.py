"""
Backend de email para Django que usa la API HTTP de Resend.
Evita conexiones SMTP bloqueadas por Railway y otros PaaS.
"""
import logging

import resend
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class ResendEmailBackend(BaseEmailBackend):

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        api_key = getattr(settings, 'RESEND_API_KEY', '') or getattr(settings, 'EMAIL_HOST_PASSWORD', '')
        if not api_key:
            logger.error('[ResendBackend] RESEND_API_KEY not configured')
        resend.api_key = api_key

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        sent = 0
        for msg in email_messages:
            try:
                params: resend.Emails.SendParams = {
                    "from": msg.from_email,
                    "to": list(msg.to),
                    "subject": msg.subject,
                }

                # Check for HTML alternative (EmailMultiAlternatives)
                html_body = None
                for content, mimetype in getattr(msg, 'alternatives', []):
                    if mimetype == 'text/html':
                        html_body = content
                        break

                # If body looks like HTML or we have an HTML alternative
                if html_body:
                    params["html"] = html_body
                    params["text"] = msg.body
                elif '<html' in msg.body.lower() or '<table' in msg.body.lower() or '<p>' in msg.body.lower():
                    params["html"] = msg.body
                else:
                    params["text"] = msg.body

                result = resend.Emails.send(params)
                logger.info('[ResendBackend] Email sent to %s — id=%s', msg.to, result.get('id', 'unknown'))
                sent += 1
            except Exception as exc:
                logger.error('[ResendBackend] Failed to send to %s: %s', msg.to, exc, exc_info=True)
                if not self.fail_silently:
                    raise
        return sent
