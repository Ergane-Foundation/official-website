import { cache } from 'react';
import { loadGithub } from './github';
import { catalog } from './site';

// One GitHub load per render pass, shared by the layout and the page.
export const getGithub = cache(loadGithub);
export const getProjects = cache(async () => catalog(await getGithub()));
