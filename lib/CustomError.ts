export default class CustomError extends Error {
	metadata: Record<string, unknown>;

	constructor(message: string, metadata: Record<string, unknown>) {
		super(message);
		this.metadata = metadata;
	}
}