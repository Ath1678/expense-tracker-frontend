import { useEffect, useMemo, useState } from "react";
import {
  AppBar, Toolbar, Typography, Container, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Stack, MenuItem, Box, Chip, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Analytics from "./components/Analytics";
import dayjs from "dayjs";
import { Grid } from "@mui/material";




import { Card, CardContent } from "@mui/material";



import {
  getExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
  getByCategory
} from "./services/ExpenseService";

const CATEGORIES = ["Food", "Travel", "Utilities", "Entertainment", "Shopping", "Other"];

export default function App() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");     // "YYYY-MM-DD"
  const [notes, setNotes] = useState("");

  // filter state
  const [filterCat, setFilterCat] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("");
    setAmount("");
    setDate("");
    setNotes("");
  };
// total spent
const totalSpent = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

// average spent
const avgSpent = rows.length > 0 ? (totalSpent / rows.length) : 0;

// monthly spent
const currentMonth = dayjs().format("YYYY-MM");
const monthlySpent = rows.reduce((sum, r) => {
  if (r.date && r.date.startsWith(currentMonth)) {
    return sum + (Number(r.amount) || 0);
  }
  return sum;
}, 0);

// highest spending category
const categoryTotals = {};
rows.forEach((r) => {
  const cat = r.category || "Other";
  categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(r.amount || 0);
});

const highestCategory = Object.keys(categoryTotals).length
  ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]
  : "-";


  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (exp) => {
    setEditingId(exp.id);
    setTitle(exp.title ?? "");
    setCategory(exp.category ?? "");
    setAmount(exp.amount ?? "");
    setDate(exp.date ?? "");
    setNotes(exp.notes ?? "");
    setOpen(true);
  };

  const loadAll = () => getExpenses().then((res) => setRows(res.data ?? []));

  const loadByCategory = (cat) => {
    if (!cat) return loadAll();
    return getByCategory(cat).then((res) => setRows(res.data ?? []));
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Derived totals for dashboard chips
  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows]
  );

  const handleSubmit = async () => {
    const payload = {
      title,
      category,
      amount: Number(amount),
      date: date || null,   // allow empty
      notes: notes || null,
    };

    if (editingId) {
      await updateExpense(editingId, payload);
    } else {
      await createExpense(payload);
    }
    await (filterCat ? loadByCategory(filterCat) : loadAll());
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    await (filterCat ? loadByCategory(filterCat) : loadAll());
  };

  const onFilterChange = async (cat) => {
    setFilterCat(cat);
    await loadByCategory(cat);
  };

  const currency = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
      .format(Number(n || 0));

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Expense Tracker</Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 6 }}>
        {/* Top actions / dashboard */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add Expense
          </Button>

          <TextField
            select
            size="small"
            label="Filter by Category"
            value={filterCat}
            onChange={(e) => onFilterChange(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>

          <Chip label={`Total: ${currency(total)}`} />
        </Stack>
		
		<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
		  <Card><CardContent>Total: ₹{total}</CardContent></Card>
		  <Card><CardContent>Avg: ₹{Math.round(total / rows.length || 0)}</CardContent></Card>
		</Stack>


        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell align="right">{currency(r.amount)}</TableCell>
                  <TableCell>{r.date || "-"}</TableCell>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>
                    {r.notes || "-"}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => openEdit(r)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(r.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No expenses yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <TextField
                label="Category"
                select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField
                label="Amount (₹)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
<Grid container spacing={2} sx={{ mb: 3 }}>
  <Grid item xs={12} md={3}>
    <Card>
      <CardContent>
        <h3>Total Spent</h3>
        <p>₹{totalSpent.toFixed(0)}</p>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} md={3}>
    <Card>
      <CardContent>
        <h3>Monthly Spent</h3>
        <p>₹{monthlySpent.toFixed(0)}</p>
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={3}>
    <Card>
      <CardContent>
        <h3>Avg Per Expense</h3>
        <p>₹{avgSpent.toFixed(0)}</p>
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={3}>
    <Card>
      <CardContent>
        <h3>Highest Category</h3>
        <p>{highestCategory}</p>
      </CardContent>
    </Card>
  </Grid>
</Grid>

              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Stack>
            <Divider sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editingId ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogActions>
        </Dialog>
		<Analytics />

      </Container>
    </Box>
  );
}
