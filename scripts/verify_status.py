import sqlite3

conn = sqlite3.connect(r'C:\Users\dell\.gemini\antigravity\scratch\ASTRACARE\backend\astracare_dev.db')
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM alerts WHERE status IN ('ACTIVE', 'ACKNOWLEDGED', 'ESCALATED')")
print('ACTIVE ALERTS COUNT:', c.fetchone()[0])

c.execute("SELECT COUNT(*) FROM alerts WHERE status = 'RESOLVED'")
print('RESOLVED ALERTS COUNT:', c.fetchone()[0])

c.execute("SELECT id, heart_rate, systolic_bp, diastolic_bp, oxygen_saturation, body_temperature FROM health_records ORDER BY id DESC LIMIT 1")
print('LATEST HEALTH RECORD:', c.fetchone())

conn.close()
