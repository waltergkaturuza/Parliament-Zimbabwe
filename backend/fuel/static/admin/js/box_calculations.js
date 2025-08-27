// Box calculations for Django Admin
function calculateTotals() {
    console.log('Calculating totals...');
    
    // Get values from form fields
    const numberOfBooks = parseInt(document.getElementById('id_number_of_books').value) || 0;
    const couponsPerBook = parseInt(document.getElementById('id_coupons_per_book').value) || 0;
    const denomination = parseInt(document.getElementById('id_denomination').value) || 0;
    
    // Calculate total coupons
    const totalCoupons = numberOfBooks * couponsPerBook;
    
    // Calculate total litres
    const totalLitres = totalCoupons * denomination;
    
    // Update the total_litres field (it should be readonly)
    const totalLitresField = document.getElementById('id_total_litres');
    if (totalLitresField) {
        totalLitresField.value = totalLitres.toFixed(2);
    }
    
    // Show calculations in the page
    updateCalculationDisplay(numberOfBooks, couponsPerBook, totalCoupons, totalLitres, denomination);
}

function updateCalculationDisplay(numberOfBooks, couponsPerBook, totalCoupons, totalLitres, denomination) {
    // Find or create a calculation display area
    let calcDisplay = document.getElementById('calculation-display');
    if (!calcDisplay) {
        calcDisplay = document.createElement('div');
        calcDisplay.id = 'calculation-display';
        calcDisplay.style.cssText = `
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-family: Arial, sans-serif;
        `;
        
        // Insert after the coupons_per_book field
        const couponsField = document.querySelector('.field-coupons_per_book');
        if (couponsField) {
            couponsField.parentNode.insertBefore(calcDisplay, couponsField.nextSibling);
        }
    }
    
    // Calculate additional values
    const usdPerLitre = 1.40;
    const zwgPerUsd = 27.50;
    const totalValueUsd = totalLitres * usdPerLitre;
    const totalValueZwg = totalValueUsd * zwgPerUsd;
    
    calcDisplay.innerHTML = `
        <h3 style="margin-top: 0; color: #495057;">📊 Automatic Calculations</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <strong>📚 Books & Coupons:</strong><br>
                ${numberOfBooks} books × ${couponsPerBook} coupons = <strong>${totalCoupons.toLocaleString()} total coupons</strong>
            </div>
            <div>
                <strong>⛽ Fuel Volume:</strong><br>
                ${totalCoupons.toLocaleString()} coupons × ${denomination}L = <strong>${totalLitres.toLocaleString()}L total</strong>
            </div>
            <div>
                <strong>💵 Value (USD):</strong><br>
                ${totalLitres.toLocaleString()}L × $${usdPerLitre}/L = <strong>$${totalValueUsd.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            <div>
                <strong>💰 Value (ZWG):</strong><br>
                $${totalValueUsd.toFixed(2)} × ZWG${zwgPerUsd} = <strong>ZWG ${totalValueZwg.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
        </div>
        <div style="margin-top: 10px; padding: 8px; background-color: #d4edda; border-radius: 3px; color: #155724;">
            ✅ Total litres field will be automatically updated when you save.
        </div>
    `;
}

// Initialize calculations when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Box calculations script loaded');
    
    // Add event listeners to relevant fields
    const fields = ['id_number_of_books', 'id_coupons_per_book', 'id_denomination'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', calculateTotals);
            field.addEventListener('change', calculateTotals);
        }
    });
    
    // Calculate initially if fields have values
    setTimeout(calculateTotals, 100);
});

// Also add a manual calculate button
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (form) {
        const calculateButton = document.createElement('button');
        calculateButton.type = 'button';
        calculateButton.textContent = '🔄 Recalculate Totals';
        calculateButton.style.cssText = `
            background-color: #007cba;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        `;
        calculateButton.onclick = calculateTotals;
        
        // Add to the submit row
        const submitRow = document.querySelector('.submit-row');
        if (submitRow) {
            submitRow.insertBefore(calculateButton, submitRow.firstChild);
        }
    }
});
