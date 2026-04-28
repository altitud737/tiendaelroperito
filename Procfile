web: cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn elroperito.wsgi --bind 0.0.0.0:$PORT
