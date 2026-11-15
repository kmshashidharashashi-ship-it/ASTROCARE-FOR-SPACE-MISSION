# ASTRACARE Datasets

## NASA Data Sources

### NASA Open Science Data Repository (OSDR)
- URL: https://osdr.nasa.gov/
- Contains: Spaceflight-related biological experiments and health data

### NASA Human Research Program (HRP)
- URL: https://www.nasa.gov/hrp/
- Contains: Research on health risks for long-duration spaceflight

### NASA Life Sciences Data Portal
- URL: https://www.nasa.gov/hrp/nlsp/

## Directory Structure

- `nasa/` - Original NASA dataset files (not included in repo due to size/licensing)
- `simulated/` - System-generated demonstration data (clearly labelled as SIMULATED)

## Dataset Import

Use the backend API endpoint:
```
POST /api/datasets/import
```

Or the CLI script:
```
python scripts/import_dataset.py --file datasets/nasa/your_file.csv --source nasa
```

## Important Notes

- NASA datasets are NOT fabricated. Only verified public data is accepted.
- Simulated data is clearly labelled and kept separate.
- Do not mix research records with demonstration records.
