import { GraphQLClient, gql } from 'graphql-request';

const endpoint = import.meta.env.VITE_MIRROR_URL;

export const client = new GraphQLClient(endpoint);

export const GET_ORDERS_QUERY = gql`
  query GetOrders($userAddress: String!) {
    orders(where: { user: { _eq: $userAddress }, status: { _in: ["Created", "Selected", "Accepted"] } }, orderBy: { createdAt: desc }) {
      id
      status
      maxTotal
      selectedAgent
      updatedAt
    }
  }
`;

export const GET_ORDER_DETAILS_QUERY = gql`
  query GetOrderDetails($orderId: String!) {
    order(by: { id: $orderId }) {
      id
      status
      user
      agent
      token
      qty
      maxTotal
      selectedFee
      holdbackBps
      microbondBps
      treasuryBps
      pod {
        otp # Assuming some pod data
      }
    }
  }
`;

export const GET_QUOTES_QUERY = gql`
  query GetQuotes($orderId: String!) {
    quotes(where: { orderId: { _eq: $orderId } }) {
      agent
      feeTotal
      etaHours
      holdbackBps
      microbondBps
      # risk would likely be joined from the agent's data
    }
  }
`;

export const GET_AGENT_QUERY = gql`
  query GetAgent($agentAddress: String!) {
    agent(by: { id: $agentAddress }) {
      riskScore
      slashes
      disputesRatio
      standingBond
      lockedMicrobond
    }
  }
`;

export const GET_AGENT_COMMITTED_QUOTES_QUERY = gql`
  query GetAgentCommittedQuotes($agentAddress: String!) {
    commits(where: { agent: { _eq: $agentAddress } }) {
      orderId
      ttl
    }
  }
`;

export const GET_AGENT_REVEALED_QUOTES_QUERY = gql`
  query GetAgentRevealedQuotes($agentAddress: String!) {
    quotes(where: { agent: { _eq: $agentAddress } }) {
      orderId
      feeTotal
      etaHours
    }
  }
`;

export const GET_AGENT_SELECTED_QUOTES_QUERY = gql`
  query GetAgentSelectedQuotes($agentAddress: String!) {
    orders(where: { selectedAgent: { _eq: $agentAddress } }) {
      id
      status
      updatedAt
    }
  }
`;
