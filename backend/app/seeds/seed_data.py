"""
Franchise POS Master Seeding Engine
Initializes schema and populates real August 2026 data from E:/Ufone Franchice App/August.xlsx
Preserves all credentials and system security roles.
"""
from app.seeds.seed_august_real_data import seed_august_real_data

def run_seed():
    print("Executing Master Franchise Seed (Real August 2026 Data)...")
    seed_august_real_data()

if __name__ == "__main__":
    run_seed()
