import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'investment_data.csv');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return NextResponse.json([]);
        }

        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) return NextResponse.json([]);

        const headers = lines[0].split(',').map(h => h.trim());
        let data = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj: any, header, i) => {
                const val = values[i]?.trim();
                // Try to parse numbers
                obj[header] = isNaN(Number(val)) || val === '' ? val : Number(val);
                return obj;
            }, {});
        });

        // Calculate B&H based on first record's total assets (evaluation + pool)
        if (data.length > 0) {
            const firstRecord = data[0];

            // Total initial investment
            const initialTotal = (firstRecord.evaluation || 0) + (firstRecord.pool || 0);
            const initialPrice = firstRecord.tqqq_price || 1;

            // How many shares could have been bought with initial total assets
            const bhShares = initialTotal / initialPrice;

            // Calculate B&H for each record: bhShares × current TQQQ price
            data = data.map((d: any) => {
                const currentPrice = d.tqqq_price || 0;
                const v_bh = bhShares * currentPrice;
                return { ...d, v_bh: Math.round(v_bh * 100) / 100 };
            });

            // Update CSV file with calculated B&H values
            const updatedLines = lines.slice(0, 1).concat(data.map((d: any) =>
                `${d.date},${d.v},${d.evaluation},${d.pool},${d.min_band},${d.max_band},${d.v_bh},${d.tqqq_price},${d.shares}`
            ));
            fs.writeFileSync(DATA_FILE, updatedLines.join('\n'));
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading investment data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, v, tqqq_price, shares, pool } = body;

        if (!date || v === undefined || tqqq_price === undefined || shares === undefined || pool === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const evaluation = Number(tqqq_price) * Number(shares);
        const vNum = Number(v);
        const min_band = (vNum * 0.85).toFixed(2);
        const max_band = (vNum * 1.15).toFixed(2);

        // B&H will be calculated automatically in GET, so we store 0 initially
        const newRow = `${date},${v},${evaluation.toFixed(2)},${pool},${min_band},${max_band},0,${tqqq_price},${shares}\n`;

        if (!fs.existsSync(DATA_FILE)) {
            const headers = 'date,v,evaluation,pool,min_band,max_band,v_bh,tqqq_price,shares\n';
            fs.writeFileSync(DATA_FILE, headers + newRow);
        } else {
            fs.appendFileSync(DATA_FILE, newRow);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving investment data:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
