import { Config, Defaults, Envs, Local } from '@dxos/config';

export const getConfig = async () => new Config(Envs(), Local(), Defaults());