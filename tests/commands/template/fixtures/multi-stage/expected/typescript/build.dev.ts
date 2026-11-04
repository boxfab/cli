import { Template, defaultBuildLogger } from 'boxfab'
import { template } from './template'

async function main() {
  await Template.build(template, 'multi-stage-dev', {
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);