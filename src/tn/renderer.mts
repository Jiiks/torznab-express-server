import nunjucks from 'nunjucks'
import path from 'path'

import { __filename, __dirname } from '#constants'
console.log("PATH: ", path.join(__dirname, 'templates'));
const env = nunjucks.configure(path.join(__dirname, 'templates'), { autoescape: true });
env.addFilter('boolToYesNo', (value: Boolean) => (value ? 'yes' : 'no'));


function render(template: String, data: Object) {
    if(!template.endsWith(".xml")) template += ".xml";
    return nunjucks.render(template, data);
}

export { render };
