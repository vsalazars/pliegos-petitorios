#!/bin/bash

# Mensaje de commit (si no pasas uno, usa default)
MSG=${1:-"update"}

echo "🟡 Agregando cambios..."
git add .

echo "🟡 Commit..."
git commit -m "$MSG"

echo "🟡 Push..."
git push

echo "🟢 Listo 🚀"
