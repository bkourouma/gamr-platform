# OpenAI Integration Setup Guide

## Overview

The GAMR platform now includes advanced AI-powered risk analysis using OpenAI's GPT models. This integration provides evidence-based risk assessments with specific citations from your evaluation data.

## Features

✅ **Evidence-Based Analysis**: AI analyzes actual evaluation data  
✅ **Structured Prompts**: Professional-grade prompts with context  
✅ **Citation Tracking**: Every conclusion cites specific evaluations  
✅ **Multi-Criterion Analysis**: Probability, Vulnerability, Impact  
✅ **Quality Assessment**: Confidence levels and reasoning quality  
✅ **Fallback Support**: Graceful degradation to simulation mode  

## Quick Setup

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

### 2. Configure Environment

Create a `.env.local` file in your project root:

```bash
# OpenAI Configuration (VITE_ prefix required for browser access)
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
VITE_OPENAI_MODEL=gpt-4-turbo-preview
VITE_OPENAI_MAX_TOKENS=2000
VITE_OPENAI_TEMPERATURE=0.3

# Feature Flags (VITE_ prefix required for browser access)
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_ENHANCED_PROMPTS=true
VITE_ENABLE_EVIDENCE_CITATIONS=true
VITE_MOCK_AI_RESPONSES=false
```

### 3. Install Dependencies

The OpenAI integration is already included in the project. No additional packages needed.

### 4. Test Configuration

1. Start your development server
2. Navigate to a risk creation page
3. Click the **Analyse IA** button
4. Check for "Citations OpenAI incluses" success message

## Configuration Options

### Models

| Model | Quality | Speed | Cost | Recommended For |
|-------|---------|-------|------|-----------------|
| `gpt-4-turbo-preview` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | **Production** |
| `gpt-4` | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ | Maximum quality |
| `gpt-3.5-turbo` | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Development/Testing |

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...                    # Your OpenAI API key

# Model Configuration
OPENAI_MODEL=gpt-4-turbo-preview         # AI model to use
OPENAI_MAX_TOKENS=2000                   # Maximum response length
OPENAI_TEMPERATURE=0.3                   # Creativity (0.0-1.0)

# Performance
AI_ANALYSIS_TIMEOUT=30000                # Timeout in milliseconds
MAX_CONCURRENT_AI_REQUESTS=3             # Parallel request limit

# Feature Flags
ENABLE_AI_ANALYSIS=true                  # Enable/disable AI analysis
ENABLE_ENHANCED_PROMPTS=true             # Use structured prompts
ENABLE_EVIDENCE_CITATIONS=true           # Include evaluation citations
MOCK_AI_RESPONSES=false                  # Use simulation instead of OpenAI

# Development
ENABLE_DEBUG_LOGGING=false               # Enable detailed logging
```

## Usage

### Basic Usage

1. **Create Risk Assessment**: Fill in target and scenario
2. **Click Analyse IA**: Button triggers AI analysis
3. **Review Results**: Get probability, vulnerability, impact scores
4. **Check Citations**: Each point includes evaluation sources

### Advanced Features

- **Evidence Citations**: `"Formation du personnel: 93% (Source: Évaluation Sécurité Personnel)"`
- **Quality Indicators**: High/Medium/Low reasoning quality
- **Confidence Levels**: Percentage confidence for each criterion
- **Questionnaire Recommendations**: Suggests additional evaluations

### Configuration Panel

Access the AI configuration panel to:
- Test OpenAI connection
- Change models and parameters
- Enable/disable features
- View configuration status

## Troubleshooting

### Common Issues

**❌ "Clé API OpenAI manquante"**
- Solution: Set `OPENAI_API_KEY` in your environment

**❌ "Quota OpenAI dépassé"**
- Solution: Check your OpenAI billing and usage limits

**❌ "Erreur de connexion à OpenAI"**
- Solution: Check internet connection and OpenAI status

**❌ "Mode Simulation" badge appears**
- Solution: Set `MOCK_AI_RESPONSES=false` and configure API key

### Debug Mode

Enable debug logging:
```bash
ENABLE_DEBUG_LOGGING=true
```

Check browser console for detailed logs:
```
🔧 AI Configuration Status:
  OpenAI Configured: ✅
  Model: gpt-4-turbo-preview
  AI Analysis: ✅
```

### Fallback Behavior

The system gracefully handles failures:
1. **OpenAI Error** → Falls back to enhanced simulation
2. **Network Error** → Uses cached/simulated responses
3. **Configuration Error** → Shows clear error messages

## Cost Optimization

### Development
```bash
OPENAI_MODEL=gpt-3.5-turbo
MOCK_AI_RESPONSES=true
```

### Production
```bash
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1500
MAX_CONCURRENT_AI_REQUESTS=2
```

### Monitoring Usage

1. Check OpenAI dashboard for usage
2. Monitor token consumption
3. Set up billing alerts
4. Use simulation mode for testing

## Security

### Best Practices

✅ **Environment Variables**: Never commit API keys to code  
✅ **Server-Side Only**: API calls happen server-side  
✅ **Rate Limiting**: Built-in request throttling  
✅ **Error Handling**: Graceful failure modes  
✅ **Validation**: Input sanitization and validation  

### API Key Security

- Store in environment variables only
- Use different keys for dev/prod
- Rotate keys regularly
- Monitor usage for anomalies

## Support

### Getting Help

1. **Configuration Issues**: Check this guide
2. **OpenAI Errors**: Check OpenAI status page
3. **Feature Requests**: Contact development team
4. **Bug Reports**: Include configuration and error logs

### Useful Links

- [OpenAI Platform](https://platform.openai.com/)
- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI Status](https://status.openai.com/)
- [GAMR Platform Documentation](./README.md)

---

🎉 **Ready to use!** Your GAMR platform now has professional-grade AI risk analysis with OpenAI integration.
