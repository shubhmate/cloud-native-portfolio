const fs = require('fs');

const path = 'index.template.html';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  { search: /Shubham Mate/g, replace: '{{PERSON_NAME}}' },
  { search: /shubhammate0604@gmail\.com/g, replace: '{{EMAIL_ADDRESS}}' },
  { search: /your-formspree-id/g, replace: '{{FORMSPREE_ID}}' },
  { search: /https:\/\/github\.com\/shubhmate/g, replace: '{{GITHUB_HANDLE}}' },
  { search: /https:\/\/www\.linkedin\.com\/in\/shubham-mate/g, replace: '{{LINKEDIN_PROFILE}}' },
  { search: /your-hashnode-handle/g, replace: '{{HASHNODE_HANDLE}}' },
  { search: /https:\/\/shubhammate\.com/g, replace: '{{PORTFOLIO_URL}}' },

  // New deep-search fields
  { search: /\.\/resume\.pdf/g, replace: '{{RESUME_LINK}}' },
  { search: /DevOps Engineer portfolio featuring CI\/CD pipelines, cloud infrastructure, containerization, and automation on AWS\. 2\+ years hands-on experience\./g, replace: '{{META_DESCRIPTION}}' },
  { search: /Open to new opportunities/g, replace: '{{HERO_SUBTITLE}}' },
  { search: /~2 years experience/g, replace: '{{YEARS_EXPERIENCE}}' },
  { search: /DevOps Engineer focused on\s*<span class="text-green-400">CI\/CD pipelines<\/span>,\s*<span class="text-blue-400">Containerization<\/span>, and\s*<span class="text-purple-400">Cloud Infrastructure<\/span>\./g, replace: '{{HERO_DESCRIPTION}}' },
  
  // Projects
  { search: /3-Tier App with Docker Compose/g, replace: '{{PROJECT_1_TITLE}}' },
  { search: /Containerized a full-stack React\/Node\.js\/MongoDB application using Docker Compose with an Nginx reverse proxy, health checks, and environment-based config\./g, replace: '{{PROJECT_1_DESC}}' },
  { search: /\{\{GITHUB_HANDLE\}\}\/3-tier-app-docker-compose/g, replace: '{{PROJECT_1_LINK}}' }, // In case it was partially replaced earlier
  { search: /https:\/\/github\.com\/shubhmate\/3-tier-app-docker-compose/g, replace: '{{PROJECT_1_LINK}}' },

  { search: /AWS VPC with Terraform/g, replace: '{{PROJECT_2_TITLE}}' },
  { search: /Provisioned a production-style AWS VPC with public\/private subnets across 2 AZs, NAT gateway, internet gateway, and security groups using Terraform\./g, replace: '{{PROJECT_2_DESC}}' },
  { search: /\{\{GITHUB_HANDLE\}\}\/ec2-monitoring-stack/g, replace: '{{PROJECT_2_LINK}}' },
  { search: /https:\/\/github\.com\/shubhmate\/ec2-monitoring-stack/g, replace: '{{PROJECT_2_LINK}}' },

  { search: /CI\/CD Pipeline — GitHub Actions/g, replace: '{{PROJECT_3_TITLE}}' },
  { search: /Built a complete CI\/CD pipeline using GitHub Actions to automate testing, Docker image creation, and deployment to an AWS EC2 instance\./g, replace: '{{PROJECT_3_DESC}}' },
  { search: /\{\{GITHUB_HANDLE\}\}\/aws-vpc-terraform/g, replace: '{{PROJECT_3_LINK}}' },
  { search: /https:\/\/github\.com\/shubhmate\/aws-vpc-terraform/g, replace: '{{PROJECT_3_LINK}}' },

  // Experience roles and bullets
  { search: /DevOps Engineer/g, replace: '{{JOB_TITLE}}' }, // Will replace the generic occurrences
  { search: /Company Name/g, replace: '{{COMPANY_NAME}}' },
  { search: /Previous Company/g, replace: '{{PREVIOUS_COMPANY}}' },
  { search: /Jan 2024/g, replace: '{{JOB_START_DATE}}' },
  { search: /Present/g, replace: '{{JOB_END_DATE}}' },
  { search: /Jun 2023/g, replace: '{{INTERNSHIP_START_DATE}}' },
  { search: /Dec 2023/g, replace: '{{INTERNSHIP_END_DATE}}' },

  // Specific experience bullets (we will let the script replace them globally)
  { search: /Maintain and improve CI\/CD pipelines using GitHub Actions for 5\+ microservices at \{\{COMPANY_NAME\}\}/g, replace: '{{EXP_1_BULLET_1}}' },
  { search: /Maintain and improve CI\/CD pipelines using GitHub Actions for 5\+ microservices at Company Name/g, replace: '{{EXP_1_BULLET_1}}' },
  
  { search: /Containerized legacy Node\.js applications using Docker, reducing environment inconsistencies at \{\{COMPANY_NAME\}\}/g, replace: '{{EXP_1_BULLET_2}}' },
  { search: /Containerized legacy Node\.js applications using Docker, reducing environment inconsistencies at Company Name/g, replace: '{{EXP_1_BULLET_2}}' },
  
  { search: /Assisted in writing Terraform scripts to provision AWS EC2, S3, and RDS resources at \{\{COMPANY_NAME\}\}/g, replace: '{{EXP_1_BULLET_3}}' },
  { search: /Assisted in writing Terraform scripts to provision AWS EC2, S3, and RDS resources at Company Name/g, replace: '{{EXP_1_BULLET_3}}' },
  
  { search: /Set up basic Prometheus \+ Grafana dashboards to monitor application health on EC2 at \{\{COMPANY_NAME\}\}/g, replace: '{{EXP_1_BULLET_4}}' },
  { search: /Set up basic Prometheus \+ Grafana dashboards to monitor application health on EC2 at Company Name/g, replace: '{{EXP_1_BULLET_4}}' },

  { search: /Junior DevOps \/ Cloud Intern/g, replace: '{{EXP_2_ROLE}}' },
  
  { search: /Supported deployment of Dockerized applications to AWS ECS using shell scripts at \{\{PREVIOUS_COMPANY\}\}/g, replace: '{{EXP_2_BULLET_1}}' },
  { search: /Supported deployment of Dockerized applications to AWS ECS using shell scripts at Previous Company/g, replace: '{{EXP_2_BULLET_1}}' },
  
  { search: /Wrote Ansible playbooks to automate server configuration across dev environments at \{\{PREVIOUS_COMPANY\}\}/g, replace: '{{EXP_2_BULLET_2}}' },
  { search: /Wrote Ansible playbooks to automate server configuration across dev environments at Previous Company/g, replace: '{{EXP_2_BULLET_2}}' },
  
  { search: /Collaborated with dev team to debug pipeline failures and reduce build times by 20% at \{\{PREVIOUS_COMPANY\}\}/g, replace: '{{EXP_2_BULLET_3}}' },
  { search: /Collaborated with dev team to debug pipeline failures and reduce build times by 20% at Previous Company/g, replace: '{{EXP_2_BULLET_3}}' },

  // Timeline Dates
  { search: /Oct 26, 2023/g, replace: '{{TIMELINE_DATE_1}}' },
  { search: /Sep 15, 2023/g, replace: '{{TIMELINE_DATE_2}}' },
  { search: /Aug 01, 2023/g, replace: '{{TIMELINE_DATE_3}}' }
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced all placeholders in index.template.html');
