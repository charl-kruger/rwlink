// Metadata key for storing callable methods
const CALLABLE_METHODS_KEY = Symbol('callableMethods');

// Interface for method metadata
interface MethodMetadata {
  name: string;
  descriptor: PropertyDescriptor;
}

/**
 * Decorator that marks a method as callable via RPC
 */
export function callable() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Get existing callable methods or create new array
    const callableMethods: MethodMetadata[] = Reflect.getMetadata(CALLABLE_METHODS_KEY, target) || [];

    // Add this method to the callable methods list
    callableMethods.push({
      name: propertyKey,
      descriptor
    });

    // Store the updated list back to metadata
    Reflect.defineMetadata(CALLABLE_METHODS_KEY, callableMethods, target);

    return descriptor;
  };
}

/**
 * Get all methods marked with @callable decorator
 */
export function getCallableMethods(target: any): MethodMetadata[] {
  return Reflect.getMetadata(CALLABLE_METHODS_KEY, target) || [];
}

/**
 * Check if a method is callable
 */
export function isCallableMethod(target: any, methodName: string): boolean {
  const callableMethods = getCallableMethods(target);
  return callableMethods.some(method => method.name === methodName);
}

/**
 * Automatic method dispatcher for RPC calls
 */
export function dispatchRpcCall(instance: any, method: string, params: any[] = []): any {
  // Check if method is callable
  if (!isCallableMethod(instance, method)) {
    throw new Error(`Method '${method}' is not callable. Did you forget to add @callable()?`);
  }

  // Check if method exists on instance
  if (typeof instance[method] !== 'function') {
    throw new Error(`Method '${method}' not found on instance`);
  }

  // Call the method with parameters
  return instance[method](...params);
}