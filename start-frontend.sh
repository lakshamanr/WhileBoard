#!/bin/bash
echo "========================================="
echo "Starting Frontend (Angular)"
echo "========================================="
echo ""
echo "Make sure backend is running first!"
echo "(Run ./start-backend.sh in another terminal)"
echo ""
echo "Frontend will be available at: http://localhost:4200"
echo ""

cd AngularProject

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

npm start
