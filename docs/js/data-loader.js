// Data Loader Module

class DataLoader {
    constructor() {
        this.cache = new Map();
        // Determine the correct base URL based on current page location
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/projects/')) {
            // We're on a project dashboard page, need to go back to root
            this.baseUrl = '../../';
        } else {
            // We're on the main page
            this.baseUrl = './';
        }
    }

    // Parse CSV string to array of objects
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = this.convertValue(values[index]);
                });
                data.push(row);
            }
        }

        return data;
    }

    // Parse a single CSV line, handling quoted values
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Convert string values to appropriate types
    convertValue(value) {
        value = value.trim();
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }

        // Check if it's a number
        if (!isNaN(value) && value !== '') {
            return parseFloat(value);
        }

        // Check if it's a boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Return as string
        return value;
    }

    // Load CSV data from URL
    async loadCSV(url) {
        try {
            // Check cache first
            const cached = getCache(url);
            if (cached) {
                return cached;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const csvText = await response.text();
            const data = this.parseCSV(csvText);

            // Cache the parsed data
            setCache(url, data, 15); // Cache for 15 minutes

            return data;
        } catch (error) {
            handleError(error, `loading CSV from ${url}`);
            return [];
        }
    }

    // Load project data
    async loadProjectData(projectName) {
        const dataPath = `${this.baseUrl}projects/${projectName}/data/`;
        
        try {
            // For IBIT Call Monitor, load the CSV file
            if (projectName === 'IBIT_Call_Monitor') {
                const csvData = await this.loadCSV(`${dataPath}ibit_calls.csv`);
                return this.processIBITData(csvData);
            }

            // Add other projects here as needed
            return null;
        } catch (error) {
            handleError(error, `loading project data for ${projectName}`);
            return null;
        }
    }

    // Process IBIT Call Monitor data
    processIBITData(rawData) {
        if (!rawData || rawData.length === 0) {
            return null;
        }

        // Sort by timestamp (newest first)
        const sortedData = rawData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Filter to only include long leap calls (time to expiration > 1 year)
        const longLeapData = sortedData.filter(row => row.time_to_expiration > 1.0);
        
        if (longLeapData.length === 0) {
            console.warn('No long leap call data found (expiration > 1 year)');
            return null;
        }
        
        // Get latest data point for summary
        const latest = longLeapData[0];
        
        // Calculate total portfolio value and returns
        const positions = this.groupByOption(longLeapData);
        let totalCurrentValue = 0;
        let totalPurchaseCost = 0;
        let totalReturn = 0;

        Object.values(positions).forEach(position => {
            const latestEntry = position[0]; // First entry is most recent
            totalCurrentValue += latestEntry.market_price * 100; // Contract value
            totalPurchaseCost += latestEntry.purchase_cost * 100;
            totalReturn += latestEntry.total_return;
        });

        const totalReturnPercentage = totalPurchaseCost > 0 ? (totalReturn / totalPurchaseCost) * 100 : 0;

        return {
            projectName: 'IBIT_Call_Monitor',
            title: 'IBIT Call Monitor',
            description: 'Monitoring IBIT call options with real-time pricing and Greeks analysis',
            lastUpdated: latest.timestamp,
            summary: {
                totalReturn: totalReturn,
                totalReturnPercentage: totalReturnPercentage,
                totalCurrentValue: totalCurrentValue,
                totalPurchaseCost: totalPurchaseCost,
                ibitPrice: latest.ibit_price,
                positionCount: Object.keys(positions).length
            },
            rawData: longLeapData,
            positions: positions
        };
    }

    // Group data by option (strike + expiration)
    groupByOption(data) {
        const groups = {};
        
        data.forEach(row => {
            const key = `${row.strike_price}_${row.expiration_date}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(row);
        });

        // Sort each group by timestamp (newest first)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });

        return groups;
    }

    // Get available projects
    getAvailableProjects() {
        return [
            {
                name: 'IBIT_Call_Monitor',
                title: 'IBIT Call Monitor',
                description: 'Monitoring IBIT call options with real-time pricing and Greeks analysis'
            }
            // Add more projects here as they are created
        ];
    }
}

// Create global instance
const dataLoader = new DataLoader(); 