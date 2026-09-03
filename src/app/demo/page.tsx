import { FeedbackView } from "@/modules/interview/views/feedback-view";

export const metadata = {
  title: "Live Recruiter Demo | MockMate AI",
  description:
    "Interactive evaluation report for a Senior Full-Stack Engineer mock interview session. Test AI feedback, scoring, and rubric breakdown without signing in.",
};

const DEMO_FEEDBACK = [
  {
    question:
      "How would you prevent race conditions and double-spending in a credit-based microservice when concurrent requests arrive simultaneously?",
    answer:
      "To prevent double-spending without introducing slow distributed locks, I implement atomic updates with optimistic predicate guards directly in the datastore. For example, in MongoDB or PostgreSQL, we execute an atomic update with a condition like WHERE credits > 0 (or {$gt: 0}), atomically decrementing the balance. If two concurrent requests arrive, only the first transaction satisfies the predicate; the second returns zero affected rows and immediately aborts. If external services downstream fail, we initiate a compensating transaction to refund the balance.",
    rating: 9,
    technicalAccuracy: 10,
    communication: 9,
    architectureTradeoffs: 9,
    feedback:
      "Exceptional explanation of optimistic concurrency control. You correctly identified that atomic conditional writes eliminate the need for distributed Redis locks, and highlighted the importance of compensating transactions for distributed fault tolerance.",
    idealAnswer:
      "An optimal approach uses atomic conditional updates at the database level (`UPDATE users SET credits = credits - 1 WHERE id = :id AND credits > 0`). In distributed systems, this avoids Redis distributed lock overhead. For external payment flows, couple this with an idempotency key table using unique constraints (e.g., Stripe eventId) and compensating sagas to safely handle downstream timeouts.",
  },
  {
    question:
      "Explain the performance differences between React Server Components (RSC) and traditional Client Components in Next.js App Router.",
    answer:
      "React Server Components execute strictly on the server and do not ship JavaScript to the browser client bundle. This significantly reduces Time-to-Interactive (TTI) and First Contentful Paint (FCP). RSCs can directly access databases, backend caches, and internal microservices with zero network roundtrips from the client. In contrast, Client Components hydrate in the browser, handle local state, effects, and DOM events. Best practice is to keep the data fetching in server components and push client components down to the leaves of the tree.",
    rating: 9,
    technicalAccuracy: 9,
    communication: 9,
    architectureTradeoffs: 9,
    feedback:
      "Strong grasp of RSC vs Client Component trade-offs. You accurately explained zero-bundle-size advantages and recommended leaf-level client component placement.",
    idealAnswer:
      "RSCs stream HTML directly from the server using React Suspense boundaries without sending component code to the client bundle. They eliminate client-side waterfalls by co-locating data queries on the server. Client components should be restricted to interactive UI islands requiring browser APIs, useState, or event listeners.",
  },
  {
    question:
      "When designing a MongoDB schema for high-throughput user activity logs, what indexing strategies and TTL mechanisms would you apply?",
    answer:
      "For high-volume activity or idempotency logs, I create compound indexes tailored to query access patterns, such as { userId: 1, createdAt: -1 } to support fast pagination and sorting without in-memory sort buffer overflows. To prevent unbound storage growth and table bloat, I add a TTL (Time-To-Live) index on the createdAt timestamp field with an expiration window (e.g. 90 days), allowing MongoDB's background thread to automatically purge expired documents.",
    rating: 8,
    technicalAccuracy: 9,
    communication: 8,
    architectureTradeoffs: 8,
    feedback:
      "Great answer on compound index directionality and TTL index maintenance. Consider also discussing how TTL background threads run once every 60 seconds and the implications for read replicas.",
    idealAnswer:
      "Compound indexes should follow the Equality, Sort, Range (ESR) rule (e.g., `{ clerkId: 1, createdAt: -1 }`). To manage storage growth, configure a TTL index on `createdAt` with `expireAfterSeconds`. For extremely high throughput, evaluate capped collections or time-series collections to optimize disk I/O.",
  },
  {
    question:
      "Tell me about a time when an external API integration failed in production and how you architected a recovery strategy.",
    answer:
      "In a previous payment integration, our webhook receiver occasionally missed events during deployment restarts, leading to delayed subscription activations. I redesigned the endpoint to be strictly idempotent using unique event ID constraints, introduced a dead-letter queue for unprocessable events, and implemented an automated reconciliation cron job that polled the provider's balance history every 6 hours to self-heal any discrepancies.",
    rating: 9,
    technicalAccuracy: 9,
    communication: 9,
    architectureTradeoffs: 9,
    feedback:
      "Clear, structured STAR response with quantifiable technical outcomes. Demonstrates real-world distributed systems operational maturity.",
    idealAnswer:
      "A senior response emphasizes: 1) Root cause identification, 2) Idempotency and DLQ implementation for transient errors, 3) Out-of-band reconciliation cron jobs to guarantee eventual consistency, and 4) Observability/alerting for failed webhook rates.",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <FeedbackView
        interviewId="demo-senior-fullstack-session"
        initialFeedback={DEMO_FEEDBACK}
        initialOverallRating={9}
        isCompleted={true}
        isDemo={true}
      />
    </div>
  );
}
