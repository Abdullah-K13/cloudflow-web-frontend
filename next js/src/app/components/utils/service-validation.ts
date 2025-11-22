"use client";

import type { ServiceItem } from "../types";

/**
 * Validates if a service is fully configured based on its type.
 * Returns an array of missing required fields.
 */
export function validateServiceConfiguration(service: ServiceItem): string[] {
  const errors: string[] = [];
  const config = service.config;
  const details = config?.details || {};
  const label = service.label || "";

  // Check if service has been opened and configured at all
  // A service is considered "configured" if it has a config object
  // But we still need to validate all required fields
  if (!config) {
    return [`${label} has not been configured. Please click on the service to configure it.`];
  }

  // Check base config fields
  if (!config.region?.trim()) {
    errors.push(`${label}: Region is required`);
  }

  // Service-specific validations
  if (label === "AWS Lambda") {
    if (!details.runtime?.trim()) errors.push(`${label}: Runtime is required`);
    if (!details.handler?.trim()) errors.push(`${label}: Handler is required`);
  }

  if (label === "AWS S3") {
    if (!details.bucketName?.trim()) {
      errors.push(`${label}: Bucket name is required`);
    } else {
      const S3_BUCKET_RE = /^(?!\d+\.)(?!-)(?!.*--)(?!.*\.$)(?!.*\.-)[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
      if (!S3_BUCKET_RE.test(details.bucketName.trim())) {
        errors.push(`${label}: Bucket name must be 3–63 chars, lowercase letters, numbers, dots, hyphens`);
      }
    }
    const region = details.region?.trim() || config.region?.trim();
    if (!region) errors.push(`${label}: Region is required`);
  }

  if (label === "AWS SQS") {
    if (!details.queueName?.trim()) errors.push(`${label}: Queue name is required`);
  }

  if (label === "AWS SNS") {
    if (!details.topicName?.trim()) errors.push(`${label}: Topic name is required`);
  }

  if (label === "DynamoDB") {
    if (!details.tableName?.trim()) errors.push(`${label}: Table name is required`);
  }

  if (label === "AWS Kinesis") {
    if (!details.streamName?.trim()) errors.push(`${label}: Stream name is required`);
  }

  if (label === "API Gateway") {
    // API Gateway might not need specific validation, but region is required
  }

  // GCP Services
  if (label === "GCP Storage") {
    if (!details.bucketName?.trim()) {
      errors.push(`${label}: Bucket name is required`);
    } else if (details.bucketName.length < 3 || details.bucketName.length > 63) {
      errors.push(`${label}: Bucket name must be 3-63 characters`);
    }
  }

  if (label === "Pub/Sub") {
    if (!details.topicName?.trim()) errors.push(`${label}: Topic name is required`);
  }

  if (label === "Cloud Run") {
    if (!details.image?.trim()) errors.push(`${label}: Container image is required`);
  }

  if (label === "GCP Firestore") {
    if (!details.locationId?.trim()) errors.push(`${label}: Location ID is required`);
  }

  // GCP Secret Manager - secret value is optional, but name should be validated if provided

  return errors;
}

/**
 * Validates all services on the canvas.
 * Returns an object with service IDs as keys and arrays of error messages as values.
 */
export function validateAllServices(services: ServiceItem[]): Record<string, string[]> {
  const allErrors: Record<string, string[]> = {};

  services.forEach((service) => {
    const errors = validateServiceConfiguration(service);
    if (errors.length > 0) {
      allErrors[service.id] = errors;
    }
  });

  return allErrors;
}

/**
 * Checks if all services are fully configured.
 */
export function areAllServicesConfigured(services: ServiceItem[]): boolean {
  if (services.length === 0) return true;
  
  return services.every((service) => {
    const errors = validateServiceConfiguration(service);
    return errors.length === 0;
  });
}

