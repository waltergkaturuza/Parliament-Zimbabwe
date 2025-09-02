#!/bin/bash
# Script to handle Django makemigrations with automatic defaults for production

echo "🔧 Creating migrations with automatic defaults..."
echo "==============================================="

# Create migrations with automatic defaults using expect or non-interactive approach
python manage.py makemigrations --verbosity=2 <<EOF
1
""
1
""
1
""
1
""
1
""
1
""
1
0
1
timezone.now
1
""
1
"MONTHLY"
1
""
1
0.0
1
0.0
1
""
1
timezone.now
1
timezone.now
1
""
1
"DRAFT"
EOF

echo "✅ Migrations created with defaults"

# Apply the migrations
echo "🚀 Applying migrations..."
python manage.py migrate

echo "🎉 Migration process completed!"
