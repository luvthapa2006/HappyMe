/**
 * HappyMe AI - Premium Health Insights Engine
 * Logic: BMR, BMI, TDEE & Health Visualization
 */

// Global State
let bmiChart = null;
let weightChart = null;

const HEALTH_DATA = {
    bmiCategories: {
        underweight: { label: 'Underweight', color: '#60a5fa' },
        normal: { label: 'Healthy', color: '#34d399' },
        overweight: { label: 'Overweight', color: '#fbbf24' },
        obese: { label: 'Obese', color: '#f87171' }
    },
    diets: {
        'non-veg': ['Grilled Salmon with Asparagus', 'Chicken Quinoa Bowl', 'Greek Yogurt & Berries'],
        'veg': ['Lentil Curry with Brown Rice', 'Roasted Chickpea Salad', 'Cottage Cheese Stir-fry'],
        'vegan': ['Tofu Scramble', 'Sweet Potato & Black Bean Tacos', 'Tempeh Buddha Bowl']
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadStoredData();
    
    document.getElementById('healthForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('pdfBtn').addEventListener('click', generatePDF);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
});

// --- CORE LOGIC ---

function calculateHealthMetrics(data) {
    const { age, gender, height, weight, activity, goal } = data;
    
    // BMI Calculation
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    // BMR (Mifflin-St Jeor)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;
    
    // TDEE (Total Daily Energy Expenditure)
    let calories = bmr * parseFloat(activity);
    
    // Adjustment based on goal
    if (goal === 'lose') calories -= 500;
    if (goal === 'gain') calories += 500;

    return {
        bmi: bmi.toFixed(1),
        calories: Math.round(calories),
        category: getBMICategory(bmi)
    };
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
}

// --- UI CONTROLLERS ---

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const btn = document.getElementById('analyzeBtn');
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.loader');

    // Visual Feedback
    btnText.style.opacity = '0';
    loader.style.display = 'block';
    btn.disabled = true;

    const formData = {
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        height: parseInt(document.getElementById('height').value),
        weight: parseInt(document.getElementById('weight').value),
        activity: document.getElementById('activity').value,
        goal: document.getElementById('goal').value,
        preference: document.getElementById('preference').value
    };

    const results = calculateHealthMetrics(formData);
    
    // Simulate processing
    setTimeout(() => {
        updateUI(results, formData);
        saveToLocal(formData, results);
        
        btnText.style.opacity = '1';
        loader.style.display = 'none';
        btn.disabled = false;
        
        document.getElementById('resultsArea').classList.remove('hidden');
        window.scrollTo({ top: document.getElementById('resultsArea').offsetTop - 100, behavior: 'smooth' });
    }, 800);
}

function updateUI(results, inputs) {
    const cat = HEALTH_DATA.bmiCategories[results.category];
    
    document.getElementById('bmiValue').innerText = results.bmi;
    document.getElementById('calorieValue').innerText = results.calories.toLocaleString();
    
    const bmiBadge = document.getElementById('bmiStatus');
    bmiBadge.innerText = cat.label;
    bmiBadge.style.background = `${cat.color}20`;
    bmiBadge.style.color = cat.color;

    renderCharts(results.bmi, results.calories, inputs.weight, inputs.goal);
    renderDietPlan(inputs.preference, inputs.goal);
}

function renderDietPlan(pref, goal) {
    const container = document.getElementById('dietSummary');
    const items = HEALTH_DATA.diets[pref];
    
    let html = `<p style="margin-bottom:15px; color:var(--text-muted)">Based on your <strong>${pref}</strong> preference and <strong>${goal}</strong> goal:</p>`;
    
    items.forEach((food, idx) => {
        html += `
            <div class="diet-item">
                <span class="badge" style="margin-right:10px">Meal 0${idx+1}</span>
                <strong>${food}</strong>
            </div>
        `;
    });

    html += `
        <div class="diet-item" style="border:none; margin-top:10px">
            <h4>💡 Weekly Roadmap</h4>
            <p style="font-size:0.9rem; color:var(--text-muted)">
                Target change: ${goal === 'maintain' ? '0kg' : '0.5kg'} / week. 
                Keep hydration above 3L/day.
            </p>
        </div>
    `;
    
    container.innerHTML = html;
}

// --- CHARTS ---

function renderCharts(bmi, calories, weight, goal) {
    if (bmiChart) bmiChart.destroy();
    if (weightChart) weightChart.destroy();

    const ctxBmi = document.getElementById('bmiChart').getContext('2d');
    const ctxWeight = document.getElementById('weightChart').getContext('2d');

    // BMI Gauge Style Chart
    bmiChart = new Chart(ctxBmi, {
        type: 'doughnut',
        data: {
            labels: ['Your BMI', 'Optimal'],
            datasets: [{
                data: [bmi, 25],
                backgroundColor: ['#6366f1', '#e2e8f0'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });

    // Weight Roadmap Chart
    const weightData = [];
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    let currentWeight = parseFloat(weight);
    const change = goal === 'lose' ? -0.5 : (goal === 'gain' ? 0.5 : 0);

    for(let i=0; i<4; i++) {
        currentWeight += change;
        weightData.push(currentWeight.toFixed(1));
    }

    weightChart = new Chart(ctxWeight, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Projected Weight (kg)',
                data: weightData,
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });
}

// --- EXTRAS ---

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('resultsArea');
    
    // Use html2canvas to capture the styled dashboard
    const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0f172a' : '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('HappyMe-Health-Report.pdf');
}

function saveToLocal(inputs, results) {
    const report = { inputs, results, date: new Date().toLocaleDateString() };
    localStorage.setItem('lastHealthReport', JSON.stringify(report));
}

function loadStoredData() {
    const saved = localStorage.getItem('lastHealthReport');
    if (saved) {
        const { inputs, results } = JSON.parse(saved);
        // Pre-fill form
        Object.keys(inputs).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.value = inputs[key];
        });
        // Show results
        updateUI(results, inputs);
        document.getElementById('resultsArea').classList.remove('hidden');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}