package com.example.sleep_efic

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import android.widget.TextView
import androidx.activity.enableEdgeToEdge


class MainActivity : AppCompatActivity() {
    lateinit var text: TextView

    fun floatArrayToBuffer(floatArray: FloatArray): FloatBuffer {
        val byteBuffer: ByteBuffer = ByteBuffer
            .allocateDirect(floatArray.size * 4)
        byteBuffer.order(ByteOrder.nativeOrder())

        val floatBuffer = byteBuffer.asFloatBuffer()

        floatBuffer.put(floatArray)
        floatBuffer.position(0)

        return floatBuffer
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        text = findViewById(R.id.text)

        val tfliteModel = loadModelFile()

        val int = Interpreter(tfliteModel)

        val input = floatArrayOf(20F, 1F, 8F, 20F , 20F , 60F, 1F, 1F, 1F, 1F, 3F)

        val inF = floatArrayToBuffer(input)

        var outs = floatArrayOf(0F)

        var outF = floatArrayToBuffer(outs)

        int.run(inF, outF )
        text.setText(outF[0].toString())
    }

    private fun loadModelFile(): MappedByteBuffer {
        val fileDescriptor = assets.openFd( "converted_model.tflite")
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }
}