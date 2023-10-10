import vcr

my_vcr = vcr.VCR(
    cassette_library_dir="./cassettes",  # Choose where you want to save your cassettes
    record_mode="once",  # 'once' ensures it only records the first time
    filter_headers=["authorization"],
)
