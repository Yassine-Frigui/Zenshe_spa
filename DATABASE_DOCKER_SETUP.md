# 🔧 Docker Database Connection Guide

## Current Database Setup

Your Docker MySQL container is running with:

```
Host: db (inside Docker network) / localhost:3307 (from your machine)
User: zenshe
Password: zenshepass
Database: zenshespa_database
Root Password: rootpassword
```

## Connection Status

✅ **Backend CAN connect to database**
❌ **Database has NO tables yet** (empty database)

## Your .env Files Explained

### backend/.env (YOUR LOCAL DEVELOPMENT)
```properties
DB_HOST=localhost
DB_PORT=4306        # Your local MySQL
DB_USER=root
DB_PASSWORD=        # Empty password
DB_NAME=zenshespa_database
```

### backend/.env.docker (DOCKER OVERRIDE)
```properties
DB_HOST=db          # Docker service name
DB_PORT=3306        # Inside Docker network
DB_USER=zenshe      # Docker MySQL user
DB_PASSWORD=zenshepass
DB_NAME=zenshespa_database
```

**How it works**: Docker Compose loads `.env` first, then `.env.docker` overrides the DB settings.

## Option 1: Import Your Existing Database

If you have data in your local MySQL (port 4306), import it into Docker:

```powershell
# From your project root
docker compose exec -T db mysql -uzenshe -pzenshepass zenshespa_database < zenshespa_database.sql
```

## Option 2: Initialize Fresh Database

Run the initialization script:

```powershell
docker compose exec backend node database/init.js
```

## Option 3: Connect from Your Machine

Connect using any MySQL client to `localhost:3307`:

```powershell
# Using MySQL command line
mysql -h 127.0.0.1 -P 3307 -uzenshe -pzenshepass zenshespa_database

# Or with root
mysql -h 127.0.0.1 -P 3307 -uroot -prootpassword zenshespa_database
```

## Quick Database Commands

**Show tables:**
```powershell
docker compose exec db mysql -uzenshe -pzenshepass zenshespa_database -e "SHOW TABLES;"
```

**Check database size:**
```powershell
docker compose exec db mysql -uzenshe -pzenshepass -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'zenshespa_database' GROUP BY table_schema;"
```

**Access MySQL shell:**
```powershell
docker compose exec db mysql -uzenshe -pzenshepass zenshespa_database
```

## Important Notes

1. **Your local MySQL (port 4306)** and **Docker MySQL (port 3307)** are completely separate
2. When containers are running, backend uses Docker MySQL
3. When you run backend locally (npm run dev), it uses your local MySQL on 4306
4. Database data persists in Docker volume `zenshe_spa_db_data`

## Next Steps

Choose ONE of these:

**A) I have data on local MySQL → Import it:**
```powershell
docker compose exec -T db mysql -uzenshe -pzenshepass zenshespa_database < zenshespa_database.sql
```

**B) I want a fresh database → Initialize:**
```powershell
docker compose exec backend node database/init.js
```

**C) I'll handle it manually** → Connect with your favorite MySQL client to `localhost:3307`

Which option would you like me to execute for you?
