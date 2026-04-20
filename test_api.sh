#!/bin/bash

BASE="http://localhost:3000/api/v1"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local result="$2"
  local expected="$3"
  if echo "$result" | grep -q "$expected"; then
    echo "  ✅ $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $desc"
    echo "     Expected: $expected"
    echo "     Got: ${result:0:250}"
    FAIL=$((FAIL+1))
  fi
}

# Extract JSON value by key using python3
jq_get() {
  local json="$1"
  local key="$2"
  echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$key','') or d.get('data',{}).get('$key',''))" 2>/dev/null
}

jq_path() {
  local json="$1"
  local path="$2"
  echo "$json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
keys = '$path'.split('.')
val = d
for k in keys:
    if isinstance(val, list): val = val[int(k)]
    else: val = val.get(k, '')
print(val)
" 2>/dev/null
}

echo ""
echo "═══════════════════════════════════════════════"
echo "  Food Delivery API - Integration Tests"
echo "═══════════════════════════════════════════════"

# ── Health Check ──────────────────────────────────
echo ""
echo "▶ Health Check"
R=$(curl -s http://localhost:3000/health)
check "GET /health" "$R" '"status":"healthy"'

# ── Auth ──────────────────────────────────────────
echo ""
echo "▶ Authentication"

ADMIN_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fooddelivery.com","password":"Admin123!"}')
check "POST /auth/login (admin)" "$ADMIN_RESP" '"role":"ADMIN"'
ADMIN_TOKEN=$(jq_path "$ADMIN_RESP" "data.token")

CLIENT_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"Client123!"}')
check "POST /auth/login (client)" "$CLIENT_RESP" '"role":"CLIENT"'
CLIENT_TOKEN=$(jq_path "$CLIENT_RESP" "data.token")

REST_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@pizzapalace.com","password":"Owner123!"}')
check "POST /auth/login (restaurant)" "$REST_RESP" '"role":"RESTAURANT"'
REST_TOKEN=$(jq_path "$REST_RESP" "data.token")

COURIER_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"courier@example.com","password":"Courier123!"}')
check "POST /auth/login (courier)" "$COURIER_RESP" '"role":"COURIER"'
COURIER_TOKEN=$(jq_path "$COURIER_RESP" "data.token")

INVALID=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fooddelivery.com","password":"wrongpassword"}')
check "POST /auth/login (invalid password → 401)" "$INVALID" '"success":false'

ME=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $CLIENT_TOKEN")
check "GET /auth/me (authenticated)" "$ME" '"role":"CLIENT"'

VAL=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"x"}')
check "POST /auth/login (validation error → 422)" "$VAL" '"success":false'

# ── Restaurants ───────────────────────────────────
echo ""
echo "▶ Restaurants"

RESTS=$(curl -s "$BASE/restaurants")
check "GET /restaurants (public)" "$RESTS" '"Pizza Palace"'
check "GET /restaurants (pagination meta)" "$RESTS" '"totalPages"'

PIZZA_REST=$(curl -s "$BASE/restaurants?search=pizza")
PIZZA_ID=$(jq_path "$PIZZA_REST" "data.0.id")
echo "  [INFO] Pizza Palace ID: $PIZZA_ID"

SINGLE=$(curl -s "$BASE/restaurants/$PIZZA_ID")
check "GET /restaurants/:id" "$SINGLE" '"menuItems"'

SEARCH=$(curl -s "$BASE/restaurants?search=pizza")
check "GET /restaurants?search=pizza" "$SEARCH" '"Pizza Palace"'

UNAUTH=$(curl -s -X POST "$BASE/restaurants" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","address":"123 Street"}')
check "POST /restaurants (no auth → 401)" "$UNAUTH" '"success":false'

# ── Orders ────────────────────────────────────────
echo ""
echo "▶ Orders"

# Extract first menu item ID from menuItems array
ITEM_ID=$(jq_path "$SINGLE" "data.menuItems.0.id")
echo "  [INFO] Menu item ID: $ITEM_ID"

ORDER=$(curl -s -X POST "$BASE/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "{\"restaurantId\":\"$PIZZA_ID\",\"deliveryAddress\":\"42 Rue de Rivoli, Paris\",\"items\":[{\"menuItemId\":\"$ITEM_ID\",\"quantity\":2}]}")
check "POST /orders (client)" "$ORDER" '"status":"PENDING"'
ORDER_ID=$(jq_path "$ORDER" "data.id")
echo "  [INFO] Order ID: $ORDER_ID"

ORDERS=$(curl -s "$BASE/orders" -H "Authorization: Bearer $CLIENT_TOKEN")
check "GET /orders (client sees own orders)" "$ORDERS" '"PENDING"'

REST_ORDERS=$(curl -s "$BASE/orders" -H "Authorization: Bearer $REST_TOKEN")
check "GET /orders (restaurant sees own orders)" "$REST_ORDERS" '"success":true'

# ── Order Status Workflow ─────────────────────────
echo ""
echo "▶ Order Status Workflow"

S1=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REST_TOKEN" \
  -d '{"status":"APPROVED"}')
check "PATCH PENDING→APPROVED (restaurant)" "$S1" '"status":"APPROVED"'

S2=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REST_TOKEN" \
  -d '{"status":"PREPARING"}')
check "PATCH APPROVED→PREPARING (restaurant)" "$S2" '"status":"PREPARING"'

S3=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REST_TOKEN" \
  -d '{"status":"READY"}')
check "PATCH PREPARING→READY (restaurant)" "$S3" '"status":"READY"'

INVALID_TRANS=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"DONE"}')
check "PATCH READY→DONE (invalid transition → error)" "$INVALID_TRANS" '"success":false'

COURIER_PROFILE=$(curl -s "$BASE/couriers/me" -H "Authorization: Bearer $COURIER_TOKEN")
COURIER_ID=$(jq_path "$COURIER_PROFILE" "data.id")
echo "  [INFO] Courier ID: $COURIER_ID"

S4=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"status\":\"DELIVERING\",\"courierId\":\"$COURIER_ID\"}")
check "PATCH READY→DELIVERING (admin + courier assignment)" "$S4" '"status":"DELIVERING"'

S5=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -d '{"status":"DONE"}')
check "PATCH DELIVERING→DONE (courier)" "$S5" '"status":"DONE"'

AUDIT=$(curl -s "$BASE/orders/$ORDER_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /orders/:id (status logs present)" "$AUDIT" '"statusLogs"'

# ── Role Enforcement ──────────────────────────────
echo ""
echo "▶ Role Enforcement"

ROLE_FAIL=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{"status":"APPROVED"}')
check "PATCH /orders/:id/status (client → 403)" "$ROLE_FAIL" '"success":false'

UNAUTH_ORDERS=$(curl -s "$BASE/orders")
check "GET /orders (no auth → 401)" "$UNAUTH_ORDERS" '"success":false'

# ── Registration ──────────────────────────────────
echo ""
echo "▶ Registration"

UNIQUE_EMAIL="newuser_$(date +%s)@test.com"
REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"Test123!\",\"name\":\"New User\",\"role\":\"CLIENT\"}")
check "POST /auth/register (new user)" "$REGISTER" '"role":"CLIENT"'

DUPLICATE=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"Test123!\",\"name\":\"New User\"}")
check "POST /auth/register (duplicate email → 409)" "$DUPLICATE" '"success":false'

# ── Summary ───────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════"
echo ""

if [ $FAIL -gt 0 ]; then
  exit 1
fi
