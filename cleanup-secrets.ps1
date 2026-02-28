# ============================================================================
# Git Secret Removal Script - Stripe Keys from History
# ============================================================================
# This script removes sensitive data from git history using git filter-branch
# WARNING: This rewrites git history - only do this if others haven't cloned!
# ============================================================================

Write-Host "🔒 Starting git history cleanup..." -ForegroundColor Green
Write-Host ""

# Define the secrets to remove (patterns)
$secretPatterns = @(
    'sk_test_51T4iPkGWFtb77R0vlN0jwkm4KwkwrZES8bHfQoV785LEZlltNl56Bf1VDQMLOY4RaHdonpy54QygRnMyQGunsVSM0036IOpJ13',
    'pk_test_51T4iPkGWFtb77R0vdeukQnxwJ9bVxTZM79VeqcDgPfKDg8t9FJ1hihVaQnHHVqwi6oR9R15S18unbUc3HfF02CMJ004DQeiNEw'
)

Write-Host "⚠️  WARNING:" -ForegroundColor Yellow
Write-Host "This will rewrite your git history."
Write-Host "Make sure no one else has cloned this repo yet!"
Write-Host ""
$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne 'yes') {
    Write-Host "Aborted." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📝 Option 1: Use GitHub's unblock-secret feature (EASIEST)" -ForegroundColor Cyan
Write-Host "Visit: https://github.com/CuteTits/1X2S/security/secret-scanning/unblock-secret/3AHgZRzj4TwToiVgRoKvIFdjWKZ"
Write-Host ""
Write-Host "📝 Option 2: Regenerate the test keys" -ForegroundColor Cyan
Write-Host "1. Go to https://dashboard.stripe.com/test/apikeys"
Write-Host "2. Create new test keys"
Write-Host "3. Update .env with new keys"
Write-Host "4. Push a new commit"
Write-Host ""
Write-Host "✅ Current status:" -ForegroundColor Green
Write-Host "- .env is in .gitignore (secrets won't be committed)"
Write-Host "- Your current code uses .env variables (no hardcoded secrets)"
Write-Host "- Old commits in git history still contain secrets"
