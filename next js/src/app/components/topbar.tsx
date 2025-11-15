"use client"
import { useDraggable } from "@dnd-kit/core"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useState, useRef } from "react"
import type { DraggableIconProps } from "./types"

const services = [
  { id: "rds", label: "AWS RDS", img: "/aws-icons/rds.png" },
  { id: "lambda", label: "AWS Lambda", img: "/aws-icons/lambda.png" },
  { id: "sns", label: "AWS SNS", img: "/aws-icons/sns.png" },
  { id: "s3", label: "AWS S3", img: "/aws-icons/s3.png" },
  { id: "ec2", label: "AWS EC2", img: "/aws-icons/ec2.png" },
  { id: "kinesis", label: "AWS Kinesis", img: "/aws-icons/kinesis.png" },
  { id: "sqs", label: "AWS SQS", img: "/aws-icons/sqs.png" },
  { id: "dynamodb", label: "DynamoDB", img: "/aws-icons/DynamoDB.png" },
  { id: "cloudfront", label: "CloudFront", img: "/placeholder-gtzyx.png" },
  { id: "apigateway", label: "API Gateway", img: "/aws-api-gateway-icon.png" },
  { id: "elasticsearch", label: "Elasticsearch", img: "/placeholder.svg?height=32&width=32" },
  { id: "redshift", label: "Redshift", img: "/placeholder.svg?height=32&width=32" },
  { id: "emr", label: "EMR", img: "/placeholder.svg?height=32&width=32" },
  { id: "glue", label: "Glue", img: "/placeholder.svg?height=32&width=32" },
  { id: "athena", label: "Athena", img: "/placeholder.svg?height=32&width=32" },
  { id: "cloudwatch", label: "CloudWatch", img: "/placeholder.svg?height=32&width=32" },
]

function DraggableIcon({ id, label, img }: DraggableIconProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: { label, img },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-2 bg-white border border-gray-300 rounded-lg cursor-grab w-14 h-14 flex items-center justify-center hover:border-blue-300 hover:shadow-md transition-all duration-200 group flex-shrink-0"
      title={label}
    >
      <img
        src={img || "/placeholder.svg"}
        alt={label}
        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-200"
      />
    </div>
  )
}

export default function TopBar() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemsPerView = 8 // Number of items to show at once

  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < services.length - itemsPerView

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(Math.max(0, currentIndex - itemsPerView))
    }
  }

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(Math.min(services.length - itemsPerView, currentIndex + itemsPerView))
    }
  }

  const visibleServices = services.slice(currentIndex, currentIndex + itemsPerView)

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm relative z-20">
      {/* Left Navigation */}
      <button
        onClick={scrollLeft}
        disabled={!canScrollLeft}
        className={`p-2 rounded-lg border transition-all duration-200 ${
          canScrollLeft
            ? 'border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
            : 'border-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        title="Previous Services"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Services Container */}
      <div className="flex-1 flex justify-center mx-4">
        <div className="flex gap-3 py-2">
          {visibleServices.map((service) => (
            <DraggableIcon key={service.id} {...service} />
          ))}
        </div>
      </div>

      {/* Right Navigation */}
      <button
        onClick={scrollRight}
        disabled={!canScrollRight}
        className={`p-2 rounded-lg border transition-all duration-200 ${
          canScrollRight
            ? 'border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
            : 'border-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        title="Next Services"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Service Counter */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-1">
          {Array.from({ length: Math.ceil(services.length / itemsPerView) }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                Math.floor(currentIndex / itemsPerView) === i
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Add Cluster Button */}
      <button className="flex items-center justify-center bg-[#F5C56C] hover:bg-[#e0ad50] px-4 py-2 text-white border-none rounded-lg cursor-pointer font-medium text-sm transition-colors duration-200 ml-4">
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          add cluster
        </span>
      </button>
    </div>
  )
}