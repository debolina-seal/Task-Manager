const nunjucks = require('nunjucks');
const path = require('path');

module.exports = function(source) {
  const callback = this.async();
  const templatePath = this.resourcePath;
  
  try {
    // Configure nunjucks environment
    const env = nunjucks.configure(path.join(__dirname, 'templates'), {
      autoescape: true,
      throwOnUndefined: false
    });
    
    // Add custom filters
    env.addFilter('formatDateTime', function(dateString) {
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    });
    
    // Render the template
    const rendered = env.renderString(source, {
      title: 'HMCTS Task Manager',
      description: 'Task management system for HMCTS caseworkers'
    });
    
    callback(null, `module.exports = ${JSON.stringify(rendered)};`);
  } catch (error) {
    callback(error);
  }
};
