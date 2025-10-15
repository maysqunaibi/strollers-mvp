// src/components/OrdersPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  VStack,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  useToast,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Badge,
} from "@chakra-ui/react";
import { RefreshCw, Eye, CheckCircle, XCircle } from "lucide-react";
import {
  listOrders,
  getOrder,
  markOrderReturned,
  cancelOrder,
  listPayments,
  getPayment,
} from "../lib/api";

const StatusTag = ({ s }) => {
  const map = {
    pending_payment: "gray",
    unlocking: "purple",
    in_use: "green",
    returned: "blue",
    unlock_failed: "red",
    overdue: "orange",
    canceled: "gray",
  };
  return <Tag colorScheme={map[s] || "gray"}>{s}</Tag>;
};

export default function OrdersPanel() {
  const toast = useToast();
  const [tab, setTab] = useState(0); // 0 Orders, 1 Payments

  // Filters
  const [orderStatus, setOrderStatus] = useState("");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  // Drawer state
  const [openOrderId, setOpenOrderId] = useState(null);
  const [openOrder, setOpenOrder] = useState(null);
  const [openPaymentId, setOpenPaymentId] = useState(null);
  const [openPayment, setOpenPayment] = useState(null);

  async function loadOrders() {
    try {
      const res = await listOrders({
        status: orderStatus || undefined,
        q: q || undefined,
        limit: 50,
      });
      setOrders(res?.data || []);
    } catch (e) {
      toast({ status: "error", title: "Failed to load orders" });
    }
  }
  async function loadPayments() {
    try {
      const res = await listPayments({ limit: 50 });
      setPayments(res?.data || []);
    } catch (e) {
      toast({ status: "error", title: "Failed to load payments" });
    }
  }

  useEffect(() => {
    if (tab === 0) loadOrders();
    if (tab === 1) loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onSearch = async () => {
    if (tab === 0) await loadOrders();
    else await loadPayments();
  };

  const openOrderDrawer = async (id) => {
    setOpenOrderId(id);
    const res = await getOrder(id);
    setOpenOrder(res?.data || null);
  };
  const openPaymentDrawer = async (id) => {
    setOpenPaymentId(id);
    const res = await getPayment(id);
    setOpenPayment(res?.data || null);
  };

  const closeDrawers = () => {
    setOpenOrderId(null);
    setOpenOrder(null);
    setOpenPaymentId(null);
    setOpenPayment(null);
  };

  const handleMarkReturned = async (id) => {
    if (!confirm("Mark this order as returned?")) return;
    await markOrderReturned(id);
    toast({ status: "success", title: "Order marked returned" });
    await loadOrders();
    if (openOrderId === id) {
      const res = await getOrder(id);
      setOpenOrder(res?.data || null);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this pending order?")) return;
    const res = await cancelOrder(id);
    if (res?.code === "00000") {
      toast({ status: "success", title: "Order canceled" });
      await loadOrders();
    } else {
      toast({ status: "error", title: res?.msg || "Cancel failed" });
    }
  };

  return (
    <VStack align="stretch" spacing={5}>
      <Card variant="outline" rounded="2xl">
        <CardHeader>
          <Heading size="md">Orders & Payments</Heading>
        </CardHeader>
        <CardBody>
          <Tabs
            index={tab}
            onChange={setTab}
            colorScheme="purple"
            variant="enclosed"
          >
            <TabList>
              <Tab>Orders</Tab>
              <Tab>Payments</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <HStack spacing={3} mb={3}>
                  <Select
                    placeholder="All statuses"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    maxW="220px"
                  >
                    <option value="pending_payment">pending_payment</option>
                    <option value="unlocking">unlocking</option>
                    <option value="in_use">in_use</option>
                    <option value="returned">returned</option>
                    <option value="unlock_failed">unlock_failed</option>
                    <option value="overdue">overdue</option>
                    <option value="canceled">canceled</option>
                  </Select>
                  <Input
                    placeholder="Search: cartNo / deviceNo / paymentId"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <Button leftIcon={<RefreshCw size={16} />} onClick={onSearch}>
                    Refresh
                  </Button>
                </HStack>

                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Created</Th>
                        <Th>Status</Th>
                        <Th>Device</Th>
                        <Th>Cart</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Payment</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {orders.map((o) => (
                        <Tr key={o.id}>
                          <Td>{new Date(o.created_at).toLocaleString()}</Td>
                          <Td>
                            <StatusTag s={o.status} />
                          </Td>
                          <Td>{o.device_no}</Td>
                          <Td>{o.cart_no || `#${o.cart_index}`}</Td>
                          <Td isNumeric>
                            {(o.amount_halalas / 100).toFixed(2)} SAR
                          </Td>
                          <Td>
                            {o.payment_id}{" "}
                            {o.payment?.status && (
                              <Badge
                                ml={2}
                                colorScheme={
                                  o.payment.status === "paid" ? "green" : "gray"
                                }
                              >
                                {o.payment.status}
                              </Badge>
                            )}
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Eye size={14} />}
                                onClick={() => openOrderDrawer(o.id)}
                              >
                                View
                              </Button>
                              {o.status === "in_use" && (
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  leftIcon={<CheckCircle size={14} />}
                                  onClick={() => handleMarkReturned(o.id)}
                                >
                                  Mark returned
                                </Button>
                              )}
                              {o.status === "pending_payment" && (
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  variant="outline"
                                  leftIcon={<XCircle size={14} />}
                                  onClick={() => handleCancel(o.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>

              <TabPanel px={0}>
                <HStack spacing={3} mb={3}>
                  <Button
                    leftIcon={<RefreshCw size={16} />}
                    onClick={loadPayments}
                  >
                    Refresh
                  </Button>
                </HStack>
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Created</Th>
                        <Th>ID</Th>
                        <Th>Status</Th>
                        <Th>Mode</Th>
                        <Th>Scheme</Th>
                        <Th isNumeric>Amount</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {payments.map((p) => (
                        <Tr key={p.id}>
                          <Td>{new Date(p.created_at).toLocaleString()}</Td>
                          <Td>{p.id}</Td>
                          <Td>
                            <Tag
                              colorScheme={
                                p.status === "paid" ? "green" : "gray"
                              }
                            >
                              {p.status}
                            </Tag>
                          </Td>
                          <Td>{p.mode}</Td>
                          <Td>{p.scheme || "-"}</Td>
                          <Td isNumeric>
                            {(p.amount_halalas / 100).toFixed(2)} SAR
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<Eye size={14} />}
                              onClick={() => openPaymentDrawer(p.id)}
                            >
                              View
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Order Drawer */}
      <Drawer
        isOpen={!!openOrderId}
        placement="right"
        onClose={closeDrawers}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Order Detail</DrawerHeader>
          <DrawerBody>
            {!openOrder ? (
              <Text>Loading…</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Text fontWeight="bold">ID:</Text>
                  <Text>{openOrder.id}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Status:</Text>
                  <StatusTag s={openOrder.status} />
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Site:</Text>
                  <Text>{openOrder.site_no}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Device:</Text>
                  <Text>{openOrder.device_no}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Cart:</Text>
                  <Text>{openOrder.cart_no || `#${openOrder.cart_index}`}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Amount:</Text>
                  <Text>{(openOrder.amount_halalas / 100).toFixed(2)} SAR</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Unlock req:</Text>
                  <Text>
                    {openOrder.unlock_requested_at
                      ? new Date(openOrder.unlock_requested_at).toLocaleString()
                      : "-"}
                  </Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Unlock conf:</Text>
                  <Text>
                    {openOrder.unlock_confirmed_at
                      ? new Date(openOrder.unlock_confirmed_at).toLocaleString()
                      : "-"}
                  </Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Returned at:</Text>
                  <Text>
                    {openOrder.returned_at
                      ? new Date(openOrder.returned_at).toLocaleString()
                      : "-"}
                  </Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Payment:</Text>
                  <Text>{openOrder.payment_id}</Text>
                </HStack>
                {openOrder.payment && (
                  <Box borderWidth="1px" rounded="md" p={3}>
                    <Text fontWeight="bold" mb={2}>
                      Payment
                    </Text>
                    <HStack>
                      <Text>ID:</Text>
                      <Text>{openOrder.payment.id}</Text>
                    </HStack>
                    <HStack>
                      <Text>Status:</Text>
                      <Tag
                        colorScheme={
                          openOrder.payment.status === "paid" ? "green" : "gray"
                        }
                      >
                        {openOrder.payment.status}
                      </Tag>
                    </HStack>
                    <HStack>
                      <Text>Mode:</Text>
                      <Text>{openOrder.payment.mode}</Text>
                    </HStack>
                    <HStack>
                      <Text>Scheme:</Text>
                      <Text>{openOrder.payment.scheme || "-"}</Text>
                    </HStack>
                    <HStack>
                      <Text>Amount:</Text>
                      <Text>
                        {(openOrder.payment.amount_halalas / 100).toFixed(2)}{" "}
                        SAR
                      </Text>
                    </HStack>
                  </Box>
                )}
                {openOrder.status === "in_use" && (
                  <Button
                    colorScheme="blue"
                    leftIcon={<CheckCircle size={16} />}
                    onClick={() => handleMarkReturned(openOrder.id)}
                  >
                    Mark returned
                  </Button>
                )}
                {openOrder.status === "pending_payment" && (
                  <Button
                    colorScheme="red"
                    variant="outline"
                    leftIcon={<XCircle size={16} />}
                    onClick={() => handleCancel(openOrder.id)}
                  >
                    Cancel
                  </Button>
                )}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Payment Drawer */}
      <Drawer
        isOpen={!!openPaymentId}
        placement="right"
        onClose={closeDrawers}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Payment Detail</DrawerHeader>
          <DrawerBody>
            {!openPayment ? (
              <Text>Loading…</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Text fontWeight="bold">ID:</Text>
                  <Text>{openPayment.id}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Status:</Text>
                  <Tag
                    colorScheme={
                      openPayment.status === "paid" ? "green" : "gray"
                    }
                  >
                    {openPayment.status}
                  </Tag>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Mode:</Text>
                  <Text>{openPayment.mode}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Scheme:</Text>
                  <Text>{openPayment.scheme || "-"}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Amount:</Text>
                  <Text>
                    {(openPayment.amount_halalas / 100).toFixed(2)} SAR
                  </Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold">Created:</Text>
                  <Text>
                    {new Date(openPayment.created_at).toLocaleString()}
                  </Text>
                </HStack>
                <Box>
                  <Text fontWeight="bold" mb={1}>
                    Raw metadata
                  </Text>
                  <Box
                    as="pre"
                    fontSize="xs"
                    p={2}
                    bg="gray.50"
                    borderWidth="1px"
                    rounded="md"
                    maxH="260px"
                    overflow="auto"
                  >
                    {openPayment.metadata_json || "{}"}
                  </Box>
                </Box>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </VStack>
  );
}
