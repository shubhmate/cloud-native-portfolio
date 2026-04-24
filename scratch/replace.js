const fs = require('fs');

let html = fs.readFileSync('index.template.html', 'utf8');

// Normalize newlines to make matching easier
const normalizedHtml = html.replace(/\r\n/g, '\n');

const startPattern = '<!-- Projects Grid -->\n        <div class="grid md:grid-cols-2 gap-6">';
const startIndex = normalizedHtml.indexOf(startPattern);

if (startIndex === -1) {
    console.error("Start not found");
    process.exit(1);
}

const afterStart = startIndex + startPattern.length;

const endPattern = '        </div>\n      </div>\n    </section>\n\n    <!-- ==================== Blog Section';
const endIndex = normalizedHtml.indexOf(endPattern, afterStart);

if (endIndex === -1) {
    console.error("End not found");
    process.exit(1);
}

// Ensure we write back with CRLF if it originally had it (fs.readFileSync keeps CRLF, our normalizedHtml has \n)
let newHtml = normalizedHtml.substring(0, afterStart) + '\n          {{PROJECTS_GRID}}\n' + normalizedHtml.substring(endIndex);

if (html.includes('\r\n')) {
    newHtml = newHtml.replace(/\n/g, '\r\n');
}

fs.writeFileSync('index.template.html', newHtml, 'utf8');
console.log("Success");
