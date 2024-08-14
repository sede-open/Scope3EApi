import { ContactEmailSource } from '../types';

export const CONTACT_EMAIL_SOURCE: { [key in ContactEmailSource]: string } = {
  [ContactEmailSource.Email]: 'Email',
  [ContactEmailSource.Events]: 'Events',
  [ContactEmailSource.Other]: 'Other',
  [ContactEmailSource.Recommended]: 'Recommend by client or supplier',
  [ContactEmailSource.SearchEngine]: 'Search Engine (Google, Bing, etc.)',
  [ContactEmailSource.SocialMedia]: 'Social Media (Linkedin, Twitter, etc)',
  [ContactEmailSource.WordOfMouth]: 'Word of mouth',
};
