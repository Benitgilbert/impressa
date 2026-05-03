import prisma from "../prisma.js";

/**
 * 💸 Record a new expense
 */
export const createExpense = async (req, res, next) => {
  try {
    const { description, amount, category, paymentMethod, shiftId, date } = req.body;
    const userId = req.user.id;

    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          description,
          amount: parseFloat(amount),
          category: category || "General",
          paymentMethod: paymentMethod || "cash",
          date: date ? new Date(date) : new Date(),
          userId,
          shiftId: shiftId || null,
        },
        include: {
          user: { select: { name: true } },
          shift: true
        }
      });

      // 🕒 If linked to a shift and paid by cash/drawer, update the shift's expected drawer amount
      if (shiftId && (paymentMethod === "cash" || paymentMethod === "drawer")) {
        await tx.shift.update({
          where: { id: shiftId },
          data: {
            expectedEndingDrawerAmount: { decrement: parseFloat(amount) }
          }
        });
      }

      return newExpense;
    });

    res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 💸 Get all expenses with filtering
 */
export const getExpenses = async (req, res, next) => {
  try {
    const { from, to, category, shiftId, userId } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (shiftId) where.shiftId = shiftId;
    if (userId) where.userId = userId;
    
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        shift: { select: { id: true, startTime: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate total
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      success: true,
      data: expenses,
      totalAmount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 💸 Get expense by ID
 */
export const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        shift: true
      }
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

/**
 * 💸 Update an expense
 */
export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, amount, category, paymentMethod, date } = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        paymentMethod,
        date: date ? new Date(date) : undefined
      }
    });

    res.json({ success: true, message: "Expense updated", data: expense });
  } catch (error) {
    next(error);
  }
};

/**
 * 💸 Delete an expense
 */
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    next(error);
  }
};
