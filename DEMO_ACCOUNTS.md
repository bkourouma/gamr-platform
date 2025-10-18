# Demo Accounts - GAMR Platform

This document contains all the demo/test accounts available for the GAMR Platform. These accounts are used for development, testing, and demonstration purposes.

## 🔑 Login Information

**Password for all accounts:** `password123`

## 👥 Available Demo Accounts

### TechCorp Solutions
A technology company with various user roles for testing different permission levels.

| Email | Role | Name | Organization | Description |
|-------|------|------|-------------|-------------|
| `admin@techcorp.com` | ADMIN | Marie Dubois | TechCorp Solutions | Full administrative access to the organization |
| `analyst@techcorp.com` | AI_ANALYST | Jean Martin | TechCorp Solutions | AI analysis and risk assessment capabilities |
| `evaluator@techcorp.com` | EVALUATOR | Sophie Laurent | TechCorp Solutions | Can create and manage risk evaluations |
| `reader@techcorp.com` | READER | Pierre Durand | TechCorp Solutions | Read-only access to risk data |

### HealthCare Plus
A healthcare organization for testing multi-tenant functionality.

| Email | Role | Name | Organization | Description |
|-------|------|------|-------------|-------------|
| `admin@healthcare-plus.com` | ADMIN | Dr. Claire Moreau | HealthCare Plus | Healthcare organization administrator |
| `evaluator@healthcare-plus.com` | EVALUATOR | Marc Rousseau | HealthCare Plus | Healthcare risk evaluator |

### GAMR Platform
Platform-level administration account.

| Email | Role | Name | Organization | Description |
|-------|------|------|-------------|-------------|
| `superadmin@gamr.com` | SUPER_ADMIN | Super Admin | GAMR Platform | Platform-wide administrative access |

## 🔐 Role Permissions

### ADMIN
- Full access to organization settings
- User management within the organization
- Risk sheet management
- Dashboard access
- All evaluator and reader permissions

### AI_ANALYST
- AI-powered risk analysis
- Risk assessment capabilities
- Dashboard access
- Risk sheet viewing and analysis

### EVALUATOR
- Create and manage risk evaluations
- Risk sheet management
- Dashboard access
- Risk data viewing and editing

### READER
- Read-only access to risk data
- Dashboard viewing
- Risk sheet viewing (no editing)

### SUPER_ADMIN
- Platform-wide administrative access
- Tenant management
- Cross-organization access
- System configuration

## 🏢 Organization Details

### TechCorp Solutions
- **Domain:** techcorp.com
- **Industry:** Technology
- **Country:** France
- **Status:** Active

### HealthCare Plus
- **Domain:** healthcare-plus.com
- **Industry:** Healthcare
- **Country:** France
- **Status:** Active

### GAMR Platform
- **Domain:** gamr.com
- **Industry:** Security Risk Management
- **Country:** France
- **Status:** Active

## 🧪 Testing Scenarios

### Multi-Tenant Isolation
- Test data isolation between TechCorp Solutions and HealthCare Plus
- Verify that users can only access their organization's data
- Confirm cross-tenant data protection

### Role-Based Access Control
- Test different permission levels with various accounts
- Verify that users can only access features appropriate to their role
- Test escalation and de-escalation scenarios

### Authentication Flow
- Test login/logout functionality
- Verify session management
- Test password validation
- Test account lockout scenarios (if implemented)

## 🔧 Development Notes

- All demo accounts use the same password (`password123`) for simplicity
- Accounts are stored in mock data for frontend development
- In production, these accounts should be removed or secured properly
- Database seeding scripts create these accounts automatically

## ⚠️ Security Notice

**IMPORTANT:** These demo accounts are for development and testing purposes only. In a production environment:

1. Remove all demo accounts
2. Implement proper user registration and authentication
3. Use strong, unique passwords for all accounts
4. Implement proper password policies
5. Enable two-factor authentication where appropriate
6. Regular security audits and account reviews

## 📝 Database Seeding

These accounts are automatically created when running the database seeding script:

```bash
npm run seed
# or
npx prisma db seed
```

The seeding process creates:
- All demo user accounts
- Associated organizations (tenants)
- Sample risk data
- Test evaluations and actions

## 🚀 Quick Start

1. Start the application
2. Navigate to the login page
3. Use any of the demo accounts above with password `password123`
4. Explore the platform with different roles to understand the functionality

---

*Last updated: $(date)*
*Platform: GAMR Security Risk Management*
