from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.core.accounting_engine import ensure_system_accounts, process_purchase_accounting, process_sale_accounting
from app.api.settings import init_default_settings
from app.models.models import (
    Role, Permission, RolePermission, User, Category, Product, Staff,
    Retailer, RSO, RSODailyReport, RSOItem, CashDenomination,
    Company, CompanyCreditAccount, CompanyCreditTransaction, Purchase,
    PurchaseItem, Sale, SaleItem, Return, ReturnItem, Expense, Salary,
    Investment, Commission, EasyLoadTransaction, RetailerCollection,
    AuditLog
)

def run_seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        ensure_system_accounts(db)
        init_default_settings(db)

        # 1. Roles & Permissions
        roles_data = [
            ("Admin", "Full unrestricted access across all franchise operations"),
            ("Manager", "Operations and inventory management"),
            ("Finance", "Financial reports, ledger, salaries, expenses, company credit"),
            ("Sales", "POS terminal, product sales, retailer dispatch"),
            ("RSO Manager", "RSO routes, daily sales sheets, cash collections"),
            ("Staff", "Standard employee profile and view"),
            ("Viewer", "Read-only access")
        ]
        roles_dict = {}
        for r_name, r_desc in roles_data:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=r_desc)
                db.add(role)
                db.flush()
            roles_dict[r_name] = role

        # 2. Users (Admin user with reference credentials!)
        admin_email = "shahidkhan@pos.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                name="Shahid Khan (Franchise Owner)",
                email=admin_email,
                hashed_password=hash_password("posUfone@123"),
                role_id=roles_dict["Admin"].id,
                phone="+92 333 9123456",
                is_active=True
            )
            db.add(admin_user)

        manager_user = db.query(User).filter(User.email == "manager@pos.com").first()
        if not manager_user:
            manager_user = User(
                name="Tariq Naveed (Operations Manager)",
                email="manager@pos.com",
                hashed_password=hash_password("posUfone@123"),
                role_id=roles_dict["Manager"].id,
                phone="+92 334 8877665",
                is_active=True
            )
            db.add(manager_user)

        finance_user = db.query(User).filter(User.email == "finance@pos.com").first()
        if not finance_user:
            finance_user = User(
                name="Rashid Qureshi (Finance Officer)",
                email="finance@pos.com",
                hashed_password=hash_password("posUfone@123"),
                role_id=roles_dict["Finance"].id,
                phone="+92 332 5544332",
                is_active=True
            )
            db.add(finance_user)

        viewer_email = "islambadshah@pos.com"
        viewer_user = db.query(User).filter(User.email == viewer_email).first()
        if not viewer_user:
            viewer_user = User(
                name="Islam Badshah",
                email=viewer_email,
                hashed_password=hash_password("posUfone@123"),
                role_id=roles_dict["Viewer"].id,
                phone="+92 333 1122334",
                is_active=True
            )
            db.add(viewer_user)
        else:
            viewer_user.role_id = roles_dict["Viewer"].id
            viewer_user.name = "Islam Badshah"
            viewer_user.hashed_password = hash_password("posUfone@123")

        db.commit()

        # 3. Categories
        categories_data = [
            ("SIM Cards", "Prepaid, Postpaid, Replacement and Data SIMs"),
            ("Super Cards & Vouchers", "SC 100, EC 350, EC 600 scratch cards and electronic vouchers"),
            ("Devices & Hardware", "4G Wingles, MiFi cloud devices, feature handsets"),
            ("Electronic Load", "U-Load, EVC bulk distributor accounts"),
            ("Accessories", "Chargers, cables, power banks and protective covers")
        ]
        cats_dict = {}
        for c_name, c_desc in categories_data:
            cat = db.query(Category).filter(Category.name == c_name).first()
            if not cat:
                cat = Category(name=c_name, description=c_desc)
                db.add(cat)
                db.flush()
            cats_dict[c_name] = cat
        db.commit()

        # 4. Products (Exact products seen in reference app + standard telecom franchise products)
        products_data = [
            {
                "name": "U Load/EVC", "sku": "EVC32435", "barcode": "899201001",
                "category": "Electronic Load", "brand": "Ufone", "unit": "Rupee",
                "purchase_price": Decimal("0.97"), "selling_price": Decimal("1.00"),
                "retailer_price": Decimal("0.98"), "rso_price": Decimal("0.975"),
                "company_price": Decimal("0.965"), "alert_quantity": Decimal("1000.00"),
                "current_stock": Decimal("50000.00"), "commission": Decimal("0.02")
            },
            {
                "name": "Paired SIM 115", "sku": "PS000115", "barcode": "899201002",
                "category": "SIM Cards", "brand": "Ufone", "unit": "Piece",
                "purchase_price": Decimal("90.00"), "selling_price": Decimal("115.00"),
                "retailer_price": Decimal("100.00"), "rso_price": Decimal("95.00"),
                "company_price": Decimal("85.00"), "alert_quantity": Decimal("50.00"),
                "current_stock": Decimal("350.00"), "commission": Decimal("5.00")
            },
            {
                "name": "E-Sims/IMSI", "sku": "ESM6544", "barcode": "899201003",
                "category": "SIM Cards", "brand": "Ufone", "unit": "Piece",
                "purchase_price": Decimal("850.00"), "selling_price": Decimal("1200.00"),
                "retailer_price": Decimal("1050.00"), "rso_price": Decimal("950.00"),
                "company_price": Decimal("800.00"), "alert_quantity": Decimal("20.00"),
                "current_stock": Decimal("85.00"), "commission": Decimal("50.00")
            },
            {
                "name": "MBB RS 5500 (4G Bolt Device)", "sku": "DVC4566", "barcode": "899201004",
                "category": "Devices & Hardware", "brand": "Ufone", "unit": "Unit",
                "purchase_price": Decimal("4800.00"), "selling_price": Decimal("5500.00"),
                "retailer_price": Decimal("5200.00"), "rso_price": Decimal("5000.00"),
                "company_price": Decimal("4700.00"), "alert_quantity": Decimal("10.00"),
                "current_stock": Decimal("24.00"), "commission": Decimal("150.00")
            },
            {
                "name": "PPC/CARDS RS 350 (Super Card)", "sku": "PPC7689", "barcode": "899201005",
                "category": "Super Cards & Vouchers", "brand": "Ufone", "unit": "Card",
                "purchase_price": Decimal("330.00"), "selling_price": Decimal("350.00"),
                "retailer_price": Decimal("338.00"), "rso_price": Decimal("335.00"),
                "company_price": Decimal("325.00"), "alert_quantity": Decimal("100.00"),
                "current_stock": Decimal("301.00"), "commission": Decimal("5.00")
            },
            {
                "name": "Loo Sim Rs 65 (Standard Prepaid)", "sku": "LIM34141", "barcode": "899201006",
                "category": "SIM Cards", "brand": "Ufone", "unit": "Piece",
                "purchase_price": Decimal("45.00"), "selling_price": Decimal("65.00"),
                "retailer_price": Decimal("55.00"), "rso_price": Decimal("50.00"),
                "company_price": Decimal("40.00"), "alert_quantity": Decimal("100.00"),
                "current_stock": Decimal("420.00"), "commission": Decimal("3.00")
            },
            {
                "name": "SC 100 Scratch Card", "sku": "SC100-001", "barcode": "899201007",
                "category": "Super Cards & Vouchers", "brand": "Ufone", "unit": "Card",
                "purchase_price": Decimal("94.00"), "selling_price": Decimal("100.00"),
                "retailer_price": Decimal("97.00"), "rso_price": Decimal("96.00"),
                "company_price": Decimal("93.00"), "alert_quantity": Decimal("200.00"),
                "current_stock": Decimal("850.00"), "commission": Decimal("1.50")
            },
            {
                "name": "EC 600 Super Card Max", "sku": "EC600-001", "barcode": "899201008",
                "category": "Super Cards & Vouchers", "brand": "Ufone", "unit": "Card",
                "purchase_price": Decimal("565.00"), "selling_price": Decimal("600.00"),
                "retailer_price": Decimal("580.00"), "rso_price": Decimal("575.00"),
                "company_price": Decimal("560.00"), "alert_quantity": Decimal("50.00"),
                "current_stock": Decimal("180.00"), "commission": Decimal("10.00")
            },
            {
                "name": "Wingle 4G USB", "sku": "WGL-4G-99", "barcode": "899201009",
                "category": "Devices & Hardware", "brand": "Ufone", "unit": "Unit",
                "purchase_price": Decimal("2200.00"), "selling_price": Decimal("2600.00"),
                "retailer_price": Decimal("2400.00"), "rso_price": Decimal("2300.00"),
                "company_price": Decimal("2150.00"), "alert_quantity": Decimal("15.00"),
                "current_stock": Decimal("18.00"), "commission": Decimal("80.00")
            },
            {
                "name": "Hand Set Ufone Feature Phone", "sku": "HND-F300", "barcode": "899201010",
                "category": "Devices & Hardware", "brand": "Ufone", "unit": "Unit",
                "purchase_price": Decimal("2800.00"), "selling_price": Decimal("3300.00"),
                "retailer_price": Decimal("3050.00"), "rso_price": Decimal("2950.00"),
                "company_price": Decimal("2750.00"), "alert_quantity": Decimal("12.00"),
                "current_stock": Decimal("4.00"), "commission": Decimal("100.00")  # Trigger low stock!
            }
        ]

        prods_dict = {}
        for p_info in products_data:
            prod = db.query(Product).filter(Product.sku == p_info["sku"]).first()
            if not prod:
                prod = Product(
                    name=p_info["name"],
                    sku=p_info["sku"],
                    barcode=p_info["barcode"],
                    category_id=cats_dict[p_info["category"]].id,
                    brand=p_info["brand"],
                    unit=p_info["unit"],
                    purchase_price=p_info["purchase_price"],
                    selling_price=p_info["selling_price"],
                    retailer_price=p_info["retailer_price"],
                    rso_price=p_info["rso_price"],
                    company_price=p_info["company_price"],
                    alert_quantity=p_info["alert_quantity"],
                    current_stock=p_info["current_stock"],
                    avg_cost=p_info["purchase_price"],
                    commission=p_info["commission"],
                    discount=Decimal("0.00"),
                    tax_percent=Decimal("0.00"),
                    status="Active",
                    description=f"Standard distribution item {p_info['name']}"
                )
                db.add(prod)
                db.flush()
            prods_dict[p_info["sku"]] = prod
        db.commit()

        # 5. Staff (8+ staff members as requested)
        staff_data = [
            ("Muhammad Ali", "ali@pos.com", "+92 333 1112233", "Shop Supervisor", Decimal("45000.00")),
            ("Asif Mehmood", "asif@pos.com", "+92 334 2223344", "Counter POS Officer", Decimal("32000.00")),
            ("Farhan Khan", "farhan@pos.com", "+92 335 3334455", "Inventory Incharge", Decimal("35000.00")),
            ("Zeeshan Ahmed", "zeeshan@pos.com", "+92 336 4445566", "Senior Sales Representative", Decimal("28000.00")),
            ("Bilal Tariq", "bilal@pos.com", "+92 331 5556677", "RSO Route Officer", Decimal("30000.00")),
            ("Kamran Shah", "kamran@pos.com", "+92 332 6667788", "RSO Route Officer", Decimal("30000.00")),
            ("Usman Ghani", "usman@pos.com", "+92 333 7778899", "Customer Support Specialist", Decimal("26000.00")),
            ("Naveed Iqbal", "naveed@pos.com", "+92 334 8889900", "Security & Dispatch", Decimal("24000.00")),
        ]
        staff_dict = {}
        for s_name, s_email, s_phone, s_role, s_salary in staff_data:
            st = db.query(Staff).filter(Staff.phone == s_phone).first()
            if not st:
                st = Staff(
                    name=s_name,
                    email=s_email,
                    phone=s_phone,
                    role=s_role,
                    salary_amount=s_salary,
                    joining_date=date(2025, 1, 15),
                    status="Active"
                )
                db.add(st)
                db.flush()
            staff_dict[s_name] = st
        db.commit()

        # 6. Retailers
        retailers_data = [
            ("Al-Madina Telecom", "Al-Madina Mobile & Photostat", "+92 333 1002001", "03331002001", "Karkhano Market, Gate 3, Peshawar", "Route A - Jamrud Road", Decimal("14500.00")),
            ("City Mobile Center", "City Mobile Care", "+92 334 2003002", "03342003002", "Saddar Road, Cantt, Peshawar", "Route B - Saddar Commercial", Decimal("8200.00")),
            ("Bilal Easyload Shop", "Bilal General Store & Eload", "+92 335 3004003", "03353004003", "University Road, Near Board Bazar", "Route C - University Corridor", Decimal("21500.00")),
            ("Khyber Communication", "Khyber Cellular Hub", "+92 336 4005004", "03364005004", "Hayatabad Phase 3 Commercial", "Route D - Hayatabad Township", Decimal("5400.00")),
            ("Rehman Cellular", "Rehman Telecom & Cards", "+92 331 5006005", "03315006005", "Charsadda Road, City Gate", "Route E - Ring Road North", Decimal("11000.00"))
        ]
        retailers_dict = {}
        for r_name, r_shop, r_phone, r_msisdn, r_addr, r_route, r_bal in retailers_data:
            ret = db.query(Retailer).filter(Retailer.name == r_name).first()
            if not ret:
                ret = Retailer(
                    name=r_name,
                    shop_name=r_shop,
                    phone=r_phone,
                    msisdn=r_msisdn,
                    address=r_addr,
                    route=r_route,
                    balance=r_bal
                )
                db.add(ret)
                db.flush()
            retailers_dict[r_name] = ret
        db.commit()

        # 7. RSOs
        rsos_data = [
            ("Tariq Mehmood", "RSO-001", "03339188221", "Route A - Jamrud Road & Karkhano", Decimal("18500.00"), Decimal("45000.00")),
            ("Asif Raza", "RSO-002", "03349277332", "Route B - Saddar Commercial & Cantt", Decimal("12400.00"), Decimal("60000.00")),
            ("Imran Ali", "RSO-003", "03359366443", "Route C - University Road & Board", Decimal("22800.00"), Decimal("35000.00")),
        ]
        rsos_dict = {}
        for rso_name, rso_code, rso_mobile, rso_route, rso_bal, rso_eload in rsos_data:
            rso = db.query(RSO).filter(RSO.code == rso_code).first()
            if not rso:
                rso = RSO(
                    name=rso_name,
                    code=rso_code,
                    mobile=rso_mobile,
                    route=rso_route,
                    joining_date=date(2025, 2, 1),
                    opening_balance=rso_bal,
                    current_balance=rso_bal,
                    easyload_balance=rso_eload,
                    sim_balance=Decimal("250.00"),
                    card_balance=Decimal("150.00"),
                    remarks=f"Designated field RSO for {rso_route}"
                )
                db.add(rso)
                db.flush()
            rsos_dict[rso_name] = rso
        db.commit()

        # 8. Company & Company Credit Account
        ufone_comp = db.query(Company).filter(Company.code == "UFONE-HQ").first()
        if not ufone_comp:
            ufone_comp = Company(
                name="Pakistan Telecommunication Company Limited (Ufone 4G Wholesale)",
                code="UFONE-HQ",
                contact_person="Regional Distribution Manager (KPK)",
                phone="+92 51 111333111",
                address="Ufone Tower, Jinnah Avenue, Blue Area, Islamabad"
            )
            db.add(ufone_comp)
            db.flush()

        comp_credit = db.query(CompanyCreditAccount).filter(CompanyCreditAccount.company_id == ufone_comp.id).first()
        if not comp_credit:
            comp_credit = CompanyCreditAccount(
                company_id=ufone_comp.id,
                reference_number="CR-UFONE-PESH-2026",
                description="Main Franchise Credit Line & Product Quota",
                total_credit=Decimal("500000.00"),
                amount_paid=Decimal("350000.00"),
                outstanding=Decimal("150000.00"),
                status="Active",
                due_date=date.today() + timedelta(days=15),
                remarks="30-day revolving credit line for SIM & Scratch card inventory"
            )
            db.add(comp_credit)
            db.flush()
        db.commit()

        # 9. Purchases
        # Check if purchases already exist
        if db.query(Purchase).count() == 0:
            # Seed Purchase 1: Credit purchase from Ufone
            pur1 = Purchase(
                invoice_number="PUR-UFONE-9821",
                company_id=ufone_comp.id,
                company_name=ufone_comp.name,
                purchase_date=date.today() - timedelta(days=5),
                subtotal=Decimal("99330.00"),
                discount=Decimal("0.00"),
                tax=Decimal("0.00"),
                total_amount=Decimal("99330.00"),
                paid_amount=Decimal("50000.00"),
                due_amount=Decimal("49330.00"),
                payment_method="Company Credit",
                payment_status="Partial",
                is_company_credit=True,
                company_credit_account_id=comp_credit.id,
                due_date=date.today() + timedelta(days=20),
                remarks="Bi-weekly stock replenishment (SIMs & Cards)"
            )
            db.add(pur1)
            db.flush()

            # Purchase items for pur1
            items1 = [
                PurchaseItem(purchase_id=pur1.id, product_id=prods_dict["PS000115"].id, quantity=Decimal("200.00"), purchase_price=Decimal("90.00"), sale_price=Decimal("115.00"), total_amount=Decimal("18000.00")),
                PurchaseItem(purchase_id=pur1.id, product_id=prods_dict["PPC7689"].id, quantity=Decimal("150.00"), purchase_price=Decimal("330.00"), sale_price=Decimal("350.00"), total_amount=Decimal("49500.00")),
                PurchaseItem(purchase_id=pur1.id, product_id=prods_dict["LIM34141"].id, quantity=Decimal("400.00"), purchase_price=Decimal("45.00"), sale_price=Decimal("65.00"), total_amount=Decimal("18000.00")),
                PurchaseItem(purchase_id=pur1.id, product_id=prods_dict["SC100-001"].id, quantity=Decimal("147.00"), purchase_price=Decimal("94.00"), sale_price=Decimal("100.00"), total_amount=Decimal("13830.00")),
            ]
            db.add_all(items1)
            db.flush()
            process_purchase_accounting(db, pur1)

            # Seed Purchase 2: Cash purchase for hardware devices
            pur2 = Purchase(
                invoice_number="PUR-DEV-1044",
                company_id=ufone_comp.id,
                company_name=ufone_comp.name,
                purchase_date=date.today() - timedelta(days=2),
                subtotal=Decimal("48000.00"),
                discount=Decimal("0.00"),
                tax=Decimal("0.00"),
                total_amount=Decimal("48000.00"),
                paid_amount=Decimal("48000.00"),
                due_amount=Decimal("0.00"),
                payment_method="Cash",
                payment_status="Paid",
                is_company_credit=False,
                remarks="10 Units 4G Bolt Devices received"
            )
            db.add(pur2)
            db.flush()
            item2 = PurchaseItem(purchase_id=pur2.id, product_id=prods_dict["DVC4566"].id, quantity=Decimal("10.00"), purchase_price=Decimal("4800.00"), sale_price=Decimal("5500.00"), total_amount=Decimal("48000.00"))
            db.add(item2)
            db.flush()
            process_purchase_accounting(db, pur2)

        # 10. Sales (Scenario demonstrating Instructions 44 & 45)
        if db.query(Sale).count() == 0:
            # Sale 1: Exact Instruction 44 Scenario:
            # 100 units @ 100 = 10,000 revenue. Cost = 90 * 100 = 9,000. Commission = 500.
            # Gross profit = 1,500.
            sale1 = Sale(
                invoice_number="SAL-INST-44",
                title="Bulk Paired SIM Dispatch (Test Scenario 44)",
                sale_date=date.today(),
                sale_type="Retailer",
                customer_name="Al-Madina Telecom",
                staff_id=staff_dict["Asif Mehmood"].id,
                retailer_id=retailers_dict["Al-Madina Telecom"].id,
                subtotal=Decimal("10000.00"),
                discount=Decimal("0.00"),
                tax=Decimal("0.00"),
                commission=Decimal("500.00"),
                total_amount=Decimal("10000.00"),
                paid_amount=Decimal("10000.00"),
                remaining_amount=Decimal("0.00"),
                payment_method="Cash",
                payment_status="Paid",
                remarks="Master Instruction 44: 100 units @ 100, cost 90, commission 500"
            )
            db.add(sale1)
            db.flush()
            s_item1 = SaleItem(
                sale_id=sale1.id,
                product_id=prods_dict["PS000115"].id,
                quantity=Decimal("100.00"),
                unit_price=Decimal("100.00"),
                unit_cost=Decimal("90.00"),
                discount=Decimal("0.00"),
                commission=Decimal("500.00"),
                total_amount=Decimal("10000.00"),
                cogs=Decimal("9000.00"),
                gross_profit=Decimal("1500.00")
            )
            db.add(s_item1)
            db.flush()
            process_sale_accounting(db, sale1)

            # Sale 2: Retailer sale on partial credit
            sale2 = Sale(
                invoice_number="SAL-RET-5512",
                title="Super Cards Supply",
                sale_date=date.today() - timedelta(days=1),
                sale_type="Retailer",
                customer_name="Bilal Easyload Shop",
                staff_id=staff_dict["Farhan Khan"].id,
                retailer_id=retailers_dict["Bilal Easyload Shop"].id,
                subtotal=Decimal("17500.00"),
                discount=Decimal("200.00"),
                tax=Decimal("0.00"),
                commission=Decimal("250.00"),
                total_amount=Decimal("17300.00"),
                paid_amount=Decimal("10000.00"),
                remaining_amount=Decimal("7300.00"),
                payment_method="Cash",
                payment_status="Partial",
                remarks="50x Super Cards 350 issued"
            )
            db.add(sale2)
            db.flush()
            s_item2 = SaleItem(
                sale_id=sale2.id,
                product_id=prods_dict["PPC7689"].id,
                quantity=Decimal("50.00"),
                unit_price=Decimal("350.00"),
                discount=Decimal("200.00"),
                commission=Decimal("250.00"),
                total_amount=Decimal("17300.00")
            )
            db.add(s_item2)
            db.flush()
            process_sale_accounting(db, sale2)

        # 11. Expenses (Include Rs. 300 for Instruction 44 validation!)
        if db.query(Expense).count() == 0:
            exp1 = Expense(
                title="Courier & SIM Delivery Transport (Scenario 44)",
                category="Transport",
                amount=Decimal("300.00"),
                paid_date=date.today(),
                payment_method="Cash",
                paid_by_name="Asif Mehmood",
                remarks="Instruction 44 validation expense"
            )
            db.add(exp1)

            exp2 = Expense(
                title="Franchise Commercial Electricity Bill",
                category="Electricity",
                amount=Decimal("14800.00"),
                paid_date=date.today() - timedelta(days=3),
                payment_method="Bank Transfer",
                paid_by_name="Rashid Qureshi",
                remarks="PESCO Commercial Tariff Sept 2026"
            )
            db.add(exp2)

            exp3 = Expense(
                title="High-speed Fiber Internet & Franchise Connectivity",
                category="Internet",
                amount=Decimal("6500.00"),
                paid_date=date.today() - timedelta(days=6),
                payment_method="Cash",
                paid_by_name="Rashid Qureshi",
                remarks="PTCL Corporate Fiber 100Mbps"
            )
            db.add(exp3)

            exp4 = Expense(
                title="RSO Motorbike Fuel Allowance",
                category="Fuel",
                amount=Decimal("4200.00"),
                paid_date=date.today() - timedelta(days=1),
                payment_method="Cash",
                paid_by_name="Tariq Mehmood",
                remarks="Weekly route fuel dispatch"
            )
            db.add(exp4)

        # 12. Salaries
        if db.query(Salary).count() == 0:
            sal1 = Salary(
                staff_id=staff_dict["Asif Mehmood"].id,
                month="September 2026",
                basic_salary=Decimal("32000.00"),
                allowances=Decimal("2000.00"),
                deductions=Decimal("0.00"),
                bonus=Decimal("1000.00"),
                commission=Decimal("1500.00"),
                net_salary=Decimal("36500.00"),
                salary_given=Decimal("36500.00"),
                remaining=Decimal("0.00"),
                paid_on=date.today() - timedelta(days=10),
                paid_by="Rashid Qureshi",
                payment_method="Bank Transfer",
                status="Paid",
                remarks="Full monthly salary disbursement"
            )
            db.add(sal1)

        # 13. Investments (matching reference app)
        if db.query(Investment).count() == 0:
            inv1 = Investment(
                name="Haji Noor Muhammad",
                phone="+92 300 9554433",
                amount_given=Decimal("200000.00"),
                purchased_amount=Decimal("120000.00"),
                returns=Decimal("25000.00"),
                remaining=Decimal("105000.00"),
                investment_date=date(2026, 8, 1),
                payment_method="Bank Transfer",
                remarks="Franchise expansion silent partner"
            )
            db.add(inv1)

            inv2 = Investment(
                name="Malik Sheraz",
                phone="+92 333 4441122",
                amount_given=Decimal("150000.00"),
                purchased_amount=Decimal("80000.00"),
                returns=Decimal("15000.00"),
                remaining=Decimal("85000.00"),
                investment_date=date(2026, 8, 15),
                payment_method="Cash",
                remarks="Device procurement working capital"
            )
            db.add(inv2)

        # 14. Returns
        if db.query(Return).count() == 0:
            ret1 = Return(
                return_number="RET-UF-001",
                return_type="Retailer Return",
                return_date=date.today() - timedelta(days=2),
                original_reference="SAL-RET-5512",
                retailer_id=retailers_dict["Bilal Easyload Shop"].id,
                total_amount=Decimal("700.00"),
                refunded_amount=Decimal("700.00"),
                cogs_reversed=Decimal("660.00"),
                reason="Damaged scratch card silver strip on 2 units",
                remarks="Exchanged and credited to retailer ledger"
            )
            db.add(ret1)
            db.flush()
            r_item1 = ReturnItem(
                return_id=ret1.id,
                product_id=prods_dict["PPC7689"].id,
                quantity=Decimal("2.00"),
                unit_price=Decimal("350.00"),
                unit_cost=Decimal("330.00"),
                total_amount=Decimal("700.00"),
                cogs_reversed=Decimal("660.00")
            )
            db.add(r_item1)

        # 15. EasyLoad Transactions
        if db.query(EasyLoadTransaction).count() == 0:
            eld1 = EasyLoadTransaction(
                date=date.today(),
                msisdn="03339188221",
                retailer_id=retailers_dict["Al-Madina Telecom"].id,
                rso_id=rsos_dict["Tariq Mehmood"].id,
                tx_type="Transfer",
                amount=Decimal("5000.00"),
                discount=Decimal("50.00"),
                commission=Decimal("100.00"),
                reference="ELD-TX-101",
                remarks="Daily retailer EVC reload"
            )
            db.add(eld1)

            eld2 = EasyLoadTransaction(
                date=date.today(),
                msisdn="03342003002",
                retailer_id=retailers_dict["City Mobile Center"].id,
                rso_id=rsos_dict["Asif Raza"].id,
                tx_type="Transfer",
                amount=Decimal("8000.00"),
                discount=Decimal("80.00"),
                commission=Decimal("160.00"),
                reference="ELD-TX-102",
                remarks="Bulk transfer for peak morning hours"
            )
            db.add(eld2)

        # 16. Digital Physical RSO Daily Report
        if db.query(RSODailyReport).count() == 0:
            rso_rep = RSODailyReport(
                report_code=f"RSO-REP-001-{date.today().strftime('%Y%m%d')}",
                rso_id=rsos_dict["Tariq Mehmood"].id,
                date=date.today(),
                route=rsos_dict["Tariq Mehmood"].route,
                total_sale_amount=Decimal("22500.00"),
                expected_cash=Decimal("22500.00"),
                cash_received=Decimal("22500.00"),
                cash_pending=Decimal("0.00"),
                cash_difference=Decimal("0.00"),
                status="Approved",
                easyload_opening=Decimal("45000.00"),
                easyload_issuance=Decimal("20000.00"),
                easyload_retailer_transfer=Decimal("18000.00"),
                easyload_closing=Decimal("47000.00"),
                finance_remarks="Cash denominations verified and physically matched with daily envelope.",
                rso_signature="Tariq Mehmood",
                sd_signature="Tariq Naveed",
                finance_signature="Rashid Qureshi"
            )
            db.add(rso_rep)
            db.flush()

            # Digital RSO Report standard items
            rso_items_seed = [
                ("Pre Paid SIM", Decimal("50.00"), Decimal("20.00"), Decimal("15.00"), Decimal("55.00"), Decimal("100.00"), Decimal("1500.00")),
                ("SC 100", Decimal("100.00"), Decimal("50.00"), Decimal("40.00"), Decimal("110.00"), Decimal("100.00"), Decimal("4000.00")),
                ("EC 350", Decimal("60.00"), Decimal("30.00"), Decimal("25.00"), Decimal("65.00"), Decimal("350.00"), Decimal("8750.00")),
                ("Rep SIM", Decimal("20.00"), Decimal("10.00"), Decimal("5.00"), Decimal("25.00"), Decimal("50.00"), Decimal("250.00")),
                ("Eload SIM", Decimal("15.00"), Decimal("5.00"), Decimal("3.00"), Decimal("17.00"), Decimal("100.00"), Decimal("300.00")),
                ("EC 600", Decimal("30.00"), Decimal("15.00"), Decimal("10.00"), Decimal("35.00"), Decimal("600.00"), Decimal("6000.00")),
                ("Wingle", Decimal("5.00"), Decimal("2.00"), Decimal("0.00"), Decimal("7.00"), Decimal("2500.00"), Decimal("0.00")),
                ("MIFI", Decimal("4.00"), Decimal("2.00"), Decimal("0.00"), Decimal("6.00"), Decimal("4500.00"), Decimal("0.00")),
                ("Hand Set", Decimal("3.00"), Decimal("2.00"), Decimal("1.00"), Decimal("4.00"), Decimal("3200.00"), Decimal("3200.00")),
            ]
            for iname, op, ni, sl, cl, rt, tot in rso_items_seed:
                item_obj = RSOItem(
                    report_id=rso_rep.id,
                    item_name=iname,
                    opening_balance=op,
                    new_issue=ni,
                    sale=sl,
                    closing_in_hand=cl,
                    rate=rt,
                    total_amount=tot
                )
                db.add(item_obj)

            # Cash Denominations (Pakistani Rupee notes matching 22,500 expected cash)
            denoms_seed = [
                (5000, 3, Decimal("15000.00")),
                (1000, 5, Decimal("5000.00")),
                (500, 4, Decimal("2000.00")),
                (100, 5, Decimal("500.00")),
                (50, 0, Decimal("0.00")),
                (20, 0, Decimal("0.00")),
                (10, 0, Decimal("0.00"))
            ]
            for denom, qty, line_tot in denoms_seed:
                db.add(CashDenomination(report_id=rso_rep.id, date=date.today(), denomination=denom, quantity=qty, total=line_tot))

        db.commit()
        print("Database seeded successfully with realistic Pakistani franchise data!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
