import { S3_PUBLIC_URL } from './files.constants';
import { FileInfo } from './files.types';

export const getFileUrlForKey = (key: string): string => `${S3_PUBLIC_URL}/${key}`;

export const getFileUrl = (file: FileInfo): string => getFileUrlForKey(file.name);