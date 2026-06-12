FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps needed for wheels (Pillow, cryptography, etc.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       gcc \
       libjpeg-dev \
       zlib1g-dev \
       libpng-dev \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install -r /app/requirements.txt

# Copy project
COPY . /app

ENV DJANGO_SETTINGS_MODULE=backend.settings
ENV PYTHONPATH=/app

EXPOSE 8000

# Development command (runserver) - docker-compose will run this for web
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
