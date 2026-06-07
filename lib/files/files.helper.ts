import { S3_PUBLIC_URL } from './files.constants';
import { FileInfo } from './files.types';

export const getFileUrl = (file: FileInfo): string => `${S3_PUBLIC_URL}/${file.name}`;