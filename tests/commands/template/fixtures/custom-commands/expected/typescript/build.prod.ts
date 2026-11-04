import { Template, defaultBuildLogger } from 'boxfab'
import { template } from './template'

async function main() {
  await Template.build(template, 'custom-app', {
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);