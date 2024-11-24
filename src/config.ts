import { Config, Defaults, Envs, Local } from '@dxos/config';

export const getConfig = async () => new Config(await Envs(), Local(), Defaults());