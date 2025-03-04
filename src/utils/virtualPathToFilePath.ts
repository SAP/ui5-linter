import path from "node:path";
import posixPath from "node:path/posix";
import type {FilePath} from "../linter/LinterContext.js";

export interface FSToVirtualPathOptions {
	relFsBasePath: string;
	virBasePath: string;
	relFsBasePathTest?: string;
	virBasePathTest?: string;
};

/**
 * Normalize provided virtual paths to the original file paths
 */
export function transformVirtualPathToFilePath(
	virtualPath: string,
	{relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest}: FSToVirtualPathOptions
): FilePath {
	if (virtualPath.startsWith(virBasePath)) {
		return path.join(relFsBasePath, posixPath.relative(virBasePath, virtualPath));
	} else if (relFsBasePathTest && virBasePathTest && virtualPath.startsWith(virBasePathTest)) {
		return path.join(relFsBasePathTest, posixPath.relative(virBasePathTest, virtualPath));
	} else if (virtualPath.startsWith("/")) {
		return posixPath.relative("/", virtualPath);
	} else {
		throw new Error(
			`Resource path ${virtualPath} is not located within the virtual source or test directories of the project`);
	}
}
