import { Template } from 'boxfab'

export const template = Template()
  .fromImage('ubuntu:latest')
  .setUser('root')
  .setWorkdir('/')
  .setUser('user')
  .setWorkdir('/home/user')