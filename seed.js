require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");

const User = require("./models/User");
const Class = require("./models/Class");
const Student = require("./models/Student");
const FeeStructure = require("./models/FeeStructure");
const FeeRecord = require("./models/FeeRecord");

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Student.deleteMany({}),
      FeeStructure.deleteMany({}),
      FeeRecord.deleteMany({})
    ]);

    const classes = await Class.insertMany(
      Array.from({ length: 10 }, (_, index) => ({
        name: `Class ${index + 1}`,
        classNumber: index + 1
      }))
    );

    const dayScholarFees = classes.map((classItem) => ({
      class: classItem._id,
      studentType: "Day Scholar",
      monthlyFee: 500
    }));

    const hostlerFees = classes.map((classItem) => ({
      class: classItem._id,
      studentType: "Hostler",
      monthlyFee: 300
    }));

    await FeeStructure.insertMany([...dayScholarFees, ...hostlerFees]);

    const adminPassword = await bcrypt.hash("admin123", 10);
    const financePassword = await bcrypt.hash("finance123", 10);

    await User.insertMany([
      {
        name: "School Admin",
        email: "admin@school.com",
        password: adminPassword,
        phone: "9000000001",
        role: "admin",
        status: "active"
      },
      {
        name: "Finance User",
        email: "finance@school.com",
        password: financePassword,
        phone: "9000000002",
        role: "finance",
        status: "active"
      }
    ]);

    const studentData = [];

    for (let i = 1; i <= 50; i++) {
      const classIndex = (i - 1) % 10;
      const studentType = i % 3 === 0 ? "Hostler" : "Day Scholar";

      studentData.push({
        name: `Student ${i}`,
        studentId: `STU${String(i).padStart(3, "0")}`,
        parentName: `Parent ${i}`,
        contactNumber: `98${String(10000000 + i).slice(-8)}`,
        class: classes[classIndex]._id,
        studentType
      });
    }

    const students = await Student.insertMany(studentData);

    const structures = await FeeStructure.find();
    const feeMap = new Map(
      structures.map(
        (item) => [`${item.class.toString()}-${item.studentType}`, item.monthlyFee]
      )
    );

    // Create demo records for the current month and two previous months.
    const now = new Date();
    const months = [];

    for (let offset = 2; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    const feeRecords = [];

    for (const month of months) {
      students.forEach((student, index) => {
        const key = `${student.class.toString()}-${student.studentType}`;
        const amount = feeMap.get(key);

        const paid =
          month !== months[months.length - 1]
            ? index % 4 !== 0
            : index % 3 === 0;

        feeRecords.push({
          student: student._id,
          class: student.class,
          studentType: student.studentType,
          month,
          amount,
          paymentStatus: paid ? "Paid" : "Unpaid",
          paymentDate: paid
            ? new Date(now.getFullYear(), now.getMonth(), Math.min(index + 1, 28))
            : null
        });
      });
    }

    await FeeRecord.insertMany(feeRecords);

    console.log("Seed completed successfully.");
    console.log("Admin: admin@school.com / admin123");
    console.log("Finance: finance@school.com / finance123");
    console.log("Created: 10 classes, 50 students, 20 fee structures, 3 months of fee records.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
