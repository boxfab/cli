import { Template, defaultBuildLogger } from 'boxfab'
import { template } from './template'

async function main() {
  await Template.build(template, 'minimal-template-dev', {
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);