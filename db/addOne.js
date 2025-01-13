import mongoose from "mongoose";

// تعريف المخطط
const lessonSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  url: {
    type: [String],
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
});

// إنشاء النموذج
const lessonModel = mongoose.model("Lesson", lessonSchema);

// وظيفة لإضافة درس جديد
async function addOne(subject, url, date) {
  const lesson = new lessonModel({
    subject: subject,
    url: url,
    date: date,
  });

  try {
    await lesson.save();
  } catch (error) {
    console.error("Error adding lesson:", error);
  }
}
async function getLesson(subject, date) {
  try {
    const lesson = await lessonModel
      .findOne({
        subject: subject,
        date: date,
      })
      .select("-_id -__v");
    if (!lesson) {
      return null; // لا توجد دروس
    }

    return lesson; // إرجاع الدرس الموجود
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return null;
  }
}

export { addOne, getLesson };
